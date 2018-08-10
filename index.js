const {minDelay, proxyList, httpOptions, concurrency} = require('./conf');
const lavine = require('lavine');
const unquick = require('unquick');
const scrape = require('./scrape');
const {onStart, onFinish, onSuccess, onError} = require('./handle');

(async () => {
    const worker = unquick(
        options => scrape(options).then(onSuccess, onError),
        minDelay || 0
    );
    const getWorker = () => {
        if(!proxyList) return () => worker(httpOptions);
        const proxy = proxyList.shift();
        if(!proxy) return null;
        const opt = {...httpOptions, proxy};
        return () => worker(opt);
    };
    await onStart();
    await lavine(getWorker, concurrency);
    await onFinish();
})();
