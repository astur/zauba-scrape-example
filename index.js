const conf = require('./conf');
const errsome = require('errsome');
const log = require('cllc')(null, '%F %T');
const scra = require('scra');
const whiler = require('whiler');
const delay = require('delay');
const oassign = require('oassign');
const db = require('./db');

const validate = require('validate-response')(conf.validate);

const save = require('monscr')(db, conf.save.data);

const saveLog = require('monscr')(db, conf.save.log);

const q = require('mq-mongo')(db, {
    name: `mq_zauba`,
    items: conf.a ? conf.targets : null,
    clean: conf.c,
    strict: true,
    tries: 1,
});

const parse = require('./parse');

const transform = require('./transform');

const check = require('./check')(db);

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
        const response = await scra(oassign(options, {url}));
        const result = {
            requestTime: response.requestTime,
            bytesSent: response.bytes.sent,
            bytesReceived: response.bytes.received,
        };
        await validate(response);
        const parsed = await parse(response);

        const records = await transform(parsed.records);
        const urls = await check(parsed.urls);

        await q.ping(tag);
        const saved = await save(records);
        await q.add(urls);
        await q.ack(tag);

        result.newAds = saved.inserted;
        result.updatedAds = saved.modified;
        result.duplicatedAds = saved.duplicated;
        result.successAds = saved.inserted + saved.modified + saved.duplicated;
        result.rejectedAds = saved.errors;

        return {url, result};
    } catch(e){
        if(/mongo/i.test(e.name)) throw e;
        await q.ack(tag);
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
    if(e.name === 'TimeoutError'){
        q.add(e.url);
        log.w(
            `Request aborted by timeout ${e.timeout} ms`,
            '\nTask returned to queue:',
            `\nURL: ${e.url}`,
        );
        collect('requestCountError', 1);
        return true;
    }
    if(e.name === 'NetworkError') collect('requestCountError', 1);
    log.e('\n', errsome(e));
    return true;
};

const onFinish = async () => {
    log.finish();
    const sum = summary();
    const result = {
        src: 'zauba',
        startDt: new Date(conf.startDt),
        endDt: new Date(),
        parseDuration: Math.ceil((Date.now() - conf.startDt) / 1000),
        result: {
            status: 'ok',
            message: '',
        },
        newAds: sum.newAds,
        updatedAds: sum.updatedAds,
        duplicatedAds: sum.duplicatedAds,
        successAds: sum.successAds,
        rejectedAds: sum.rejectedAds,
        requestCountSuccess: sum.requestCountSuccess,
        requestCountError: sum.requestCountError,
        requestCountTotal: sum.requestCountSuccess + sum.requestCountError,
        bytesSent: sum.bytesSent,
        bytesReceived: sum.bytesReceived,
        requestTimeMin: sum.requestTime.min,
        requestTimeMax: sum.requestTime.max,
        requestTimeAvg: sum.requestTime.avg,
        requestTime95Percentile: sum.requestTime.quantile['0.95'],
    };
    log.i('\n', result);
    await saveLog(result).catch(e => log.e('\n', errsome(e)));
    (await db).close();
};

const options = {
    timeout: 10000,
    compressed: true,
};

const work = () => scrape(options).then(onSuccess, onError);

log.start('[ %s - pages scraped]');

Promise.all([...Array(conf.concurrency)].map(() => whiler(work))).then(onFinish).catch(e => log.e('\n', errsome(e)));
