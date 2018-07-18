const conf = require('./conf');
const lavine = require('lavine');
const pMinDelay = require('p-min-delay');
const scrape = require('./scrape');
const {onStart, onFinish} = require('./handle');
const oassign = require('oassign');

(async () => {
    const flows = conf.proxyList.map(v => {
        const opt = oassign(conf.httpOptions, {proxy: v});
        return () => pMinDelay(scrape(opt), conf.minDelay);
    });
    await onStart();
    await lavine(flows, conf.concurrency);
    await onFinish();
})();
