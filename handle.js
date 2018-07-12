const conf = require('./conf');
const db = require('./db');
const log = require('cllc')(null, '%F %T');
const delay = require('delay');
const errsome = require('errsome');
const saveLog = require('monscr')(db, conf.save.log);
const q = require('./queue');
const {collect, summary} = require('./sc');
const _ = require('./conductor');

const onSuccess = async s => {
    await _.wait();
    collect('requestCountSuccess', 1);
    collect(s.result);
    log.step();
    return !_.stopped();
};

const onError = async e => {
    await _.wait();
    if(e.name === 'QueueGetError'){
        if(e.stats.active){
            await delay(conf.waitForActive);
            return !_.stopped();
        }
        return;
    }
    if(e.name === 'ValidateResponceError' && e.codes.includes('E_INVALID_STATUS') && e.statusCode === 301){
        q.add(e.headers.location);
        log.w(`Redirected permanently.\nFrom: ${e.url}\nTo: ${e.headers.location}`);
        return !_.stopped();
    }
    collect('requestCountError', 1);
    if(e.name === 'TimeoutError'){
        q.add(e.url);
        _.error(e.url);
        log.w(`Request aborted by timeout ${e.timeout} ms\nTask returned to queue:\nURL: ${e.url}`);
        _.pause(conf.waitAfterTimeoutError);
        return !_.stopped();
    }
    if(e.name === 'NetworkError'){
        log.e('\n', errsome(e));
        return !_.stopped();
    }
    log.e('\n', errsome(e));
    _.stop();
};

const onStart = async () => {
    log.start('[ %s - pages scraped]');
    if(conf.a) await q.add(conf.targets);
};

const onFinish = async () => {
    try {
        const sum = summary();
        log.i('\n', sum);
        await saveLog(sum);
    } catch(e){
        log.e('\n', errsome(e));
    }
    (await db).close();
    _.cleanup();
};

module.exports = {onSuccess, onError, onStart, onFinish};
