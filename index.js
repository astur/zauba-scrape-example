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

const q = require('mq-mongo')(db, conf.queue);

const parse = require('./parse');

const transform = require('./transform');

const check = require('./check')(db);

const {collect, summary} = require('./sc');

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

        return {url, result: oassign(result, saved)};
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
    if(/mongo|collection/i.test(e.name)) return;
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
    log.i('\n', sum);
    await saveLog(sum).catch(e => log.e('\n', errsome(e)));
    (await db).close();
};

const work = () => scrape(conf.httpOptions).then(onSuccess, onError);

log.start('[ %s - pages scraped]');

Promise.all([...Array(conf.concurrency)].map(() => whiler(work))).then(onFinish).catch(e => log.e('\n', errsome(e)));
