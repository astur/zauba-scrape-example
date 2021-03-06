const {waitForActive, verbose, waitAfterError, targets} = require('./conf');
const db = require('./db');
const log = require('cllc')(null, '%F %T');
const delay = require('delay');
const {saveLog} = require('./save');
const q = require('./queue');
const {collect, summary} = require('./sc');
const _ = require('./conductor');

const onSuccess = async result => {
    await _.wait();
    collect('requestCountSuccess', 1);
    collect(result);
    log.inc(1);
    return !_.stopped();
};

const onError = async e => {
    await _.wait();
    if(e.name === 'QueueGetError'){
        if(e.stats.active){
            await delay(waitForActive);
            return !_.stopped();
        }
        return false;
    }
    if(e.name === 'ValidateResponceError' && e.codes.includes('E_INVALID_STATUS') && e.statusCode === 301){
        q.add(e.headers.location);
        if(verbose) log.w(`Redirected permanently.\nFrom: ${e.url}\nTo: ${e.headers.location}`);
        log.inc(2);
        return !_.stopped();
    }
    collect('requestCountError', 1);
    log.inc(3);
    if(e.name === 'TimeoutError'){
        q.add(e.url);
        _.error(e.url);
        if(verbose) log.w(`Request aborted by timeout ${e.timeout} ms\nTask returned to queue:\nURL: ${e.url}`);
        _.pause(waitAfterError);
        return !_.stopped();
    }
    if(e.name === 'NetworkError'){
        q.add(e.url);
        _.error(e.url);
        if(verbose) log.w(`NetworkError: ${e.cause.name} | ${e.cause.message}\nTask returned to queue:\nURL: ${e.url}`);
        _.pause(waitAfterError);
        return !_.stopped();
    }
    log.e(e);
    _.stop({
        status: 'error',
        error: e.name,
        message: e.message,
    });
    return false;
};

const onStart = async () => {
    log.i(`Scraping ${targets ? 'started' : 'resumed'}`);
    log.start('[ %s - pages scraped | %s - redirects | %s - errors ]');
    if(targets) await q.add(targets);
};

const onFinish = async () => {
    try {
        const sum = summary(_.stopped());
        log.finish();
        log.i(`Scraping ${sum.status === 'ok' ? 'finished' : 'stopped'}\n`, sum);
        await saveLog(sum);
    } catch(e){
        log.e(e);
    }
    (await db).close();
    _.cleanup();
};

module.exports = {onSuccess, onError, onStart, onFinish};
