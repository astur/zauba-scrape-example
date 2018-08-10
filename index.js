const conf = require('./conf');
const lavine = require('lavine');
const unquick = require('unquick');
const scrape = require('./scrape');
const {onStart, onFinish, onSuccess, onError} = require('./handle');

(async () => {
    const worker = unquick(
        options => scrape(options).then(onSuccess, onError),
        conf.minDelay || 0
    );
    const getWorker = () => {
        if(!conf.proxyList) return () => worker(conf.httpOptions);
        const proxy = conf.proxyList.shift();
        if(!proxy) return null;
        const opt = {...conf.httpOptions, proxy};
        return () => worker(opt);
    };
    await onStart();
    await lavine(getWorker, conf.concurrency);
    await onFinish();
})();
