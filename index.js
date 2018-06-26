const conf = require('./conf');
const errsome = require('errsome');
const log = require('cllc')(null, '%F %T');
const scra = require('scra');
const whiler = require('whiler');
const delay = require('delay');
const db = require('./db');

const targets = require('./targets');

const validate = require('validate-response')({
    codes: 200,
    bodyMatch: /<\/html>/,
});
const save = require('monscr')(db, {
    index: 'url',
    cleanErrors: conf.C,
    cleanValid: conf.C,
});
const q = require('mq-mongo')(db, {
    name: `mq_zauba`,
    items: conf.a ? targets : null,
    clean: conf.c,
    strict: true,
    tries: 1,
});

const parse = require('./parse');

const {collect, summary} = require('summary-collector')({
    counters: [
        'bytesSent',
        'bytesReceived',
        'newAds',
        'updatedAds',
        'duplicatedAds',
        'successAds',
        'rejectedAds',
        'requestCountSuccess',
        'requestCountError',
    ],
    quantile: 0.95,
});

const scrape = async options => {
    const {data: url, tag} = await q.get();

    try {
        const response = await scra(Object.assign({}, options, {url}));
        const result = {
            requestTime: response.requestTime,
            bytesSent: response.bytes.sent,
            bytesReceived: response.bytes.received,
        };
        await validate(response);
        const parsed = await parse(response);

        // const records = await transform(parsed.records);
        // const urls = await check(parsed.urls);

        await q.ping(tag);
        const saved = await save(parsed.records);
        await q.add(parsed.urls);
        await q.ack(tag);

        result.newAds = saved.inserted;
        result.updatedAds = saved.modified;
        result.duplicatedAds = saved.duplicated;
        result.successAds = saved.inserted + saved.modified + saved.duplicated;
        result.rejectedAds = saved.errors;

        return {url, result};
    } catch(e){
        if(/mongo/i.test(e.name)) throw e;
        if(conf.z){
            await q.ping(tag, 1);
        } else {
            await q.ack(tag);
        }
        throw e;
    }
};

const onSuccess = s => {
    collect('requestCountSuccess', 1);
    collect(s.result);
    log.step();
    return true;
};

const onError = async e => {
    if(e.name === 'QueueGetError'){
        if(e.stats.active){
            await delay(conf.waitForActive);
            return true;
        }
        return;
    }
    if(e.name === 'ValidateResponceError' && e.codes.includes('E_INVALID_STATUS') && e.statusCode === 301){
        q.add(e.headers.location);
        log.w(
            'Redirected permanently.',
            '\nFrom: ',
            e.url,
            '\nTo: ',
            e.headers.location,
        );
        return true;
    }
    log.e('\n', errsome(e));
    if(['TimeoutError', 'NetworkError'].includes(e.name)) collect('requestCountError', 1);
    return true;
};

const onFinish = async () => {
    log.finish();
    const sum = {
        src: 'zauba',
        startDt: new Date(conf.startDt),
        endDt: new Date(),
        parseDuration: Math.ceil((Date.now() - conf.startDt) / 1000),
        result: {
            status: 'ok',
            message: '',
        },
    };
    const failed = conf.z ? {failedTasks: await q.failed()} : {};
    log.i('\n', Object.assign({}, sum, summary(), failed));
    (await db).close();
};

const options = {
    timeout: 10000,
    compressed: true,
};

const work = () => scrape(options).then(onSuccess, onError);

log.start('[ %s - pages scraped]');

Promise.all([...Array(conf.concurrency)].map(() => whiler(work))).then(onFinish);
