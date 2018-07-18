const conf = require('./conf');
const lavine = require('lavine');
const pMinDelay = require('p-min-delay');
const scrape = require('./scrape');
const {onStart, onFinish} = require('./handle');
const oassign = require('oassign');

(async () => {
    const flows = (conf.p ? conf.proxyList : [...Array(conf.concurrency)]).map(v => {
        const opt = v ? oassign(conf.httpOptions, {proxy: v}) : conf.httpOptions;
        return () => pMinDelay(scrape(opt), conf.minDelay);
    });
    await onStart();
    await lavine(flows, conf.concurrency);
    await onFinish();
})();
