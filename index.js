const conf = require('./conf');
const lavine = require('lavine');
const unquick = require('unquick');
const scrape = require('./scrape');
const {onStart, onFinish} = require('./handle');
const oassign = require('oassign');

(async () => {
    const worker = unquick(scrape, conf.minDelay);
    const getWorker = () => () => worker(conf.httpOptions);
    const getProxyWorker = () => {
        const proxy = conf.proxyList.shift();
        if(!proxy) return null;
        const opt = oassign(conf.httpOptions, {proxy});
        return () => worker(opt);
    };
    await onStart();
    await lavine(conf.p ? getProxyWorker : getWorker, conf.concurrency);
    await onFinish();
})();
