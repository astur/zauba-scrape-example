const conf = require('./conf');
const db = require('./db');
const log = require('cllc')(null, '%F %T');
const delay = require('delay');
const errsome = require('errsome');
const saveLog = require('monscr')(db, conf.save.log);
const q = require('./queue');
const {collect, summary} = require('./sc');

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

const onStart = async () => {
    log.start('[ %s - pages scraped]');
};

const onFinish = async () => {
    log.finish();
    const sum = summary();
    log.i('\n', sum);
    await saveLog(sum).catch(e => log.e('\n', errsome(e)));
    (await db).close();
};

module.exports = {onSuccess, onError, onStart, onFinish};
