const conf = require('./conf');
const lavine = require('lavine');
const pMinDelay = require('p-min-delay');
const scrape = require('./scrape');
const {onStart, onFinish} = require('./handle');
const oassign = require('oassign');

(async () => {
    const getWorker = () => () => pMinDelay(scrape(conf.httpOptions), conf.minDelay);
    const getProxyWorker = () => {
        const proxy = conf.proxyList.shift();
        if(!proxy) return null;
        const opt = oassign(conf.httpOptions, {proxy});
        return () => pMinDelay(scrape(opt), conf.minDelay);
    };
    await onStart();
    await lavine(conf.p ? getProxyWorker : getWorker, conf.concurrency);
    await onFinish();
})();
