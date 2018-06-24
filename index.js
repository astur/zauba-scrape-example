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
};

const onSuccess = s => {
    collect('requestCountSuccess', 1);
    collect(s.result);
    // log.i('\n', s);
    log.step();
    return true;
};
const onError = async e => {
    if(e.name === 'QueueGetError'){
        if(e.stats.active){
            await delay(500);
            return true;
        }
        return;
    }
    log.e('\n', errsome(e));
    if(['TimeoutError', 'NetworkError'].includes(e.name)) collect('requestCountError', 1);
    return true;
};
const onFinish = async () => {
    log.d('\n', summary());
    log.finish();
    (await db).close();
};
const options = {
    timeout: 10000,
    compressed: true,
};

const work = () => scrape(options).then(onSuccess, onError);

log.start('[ %s - pages scraped]');

Promise.all([whiler(work), whiler(work)]).then(onFinish);
