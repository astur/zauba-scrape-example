const conf = require('./conf');
const lavine = require('lavine');
const pMinDelay = require('p-min-delay');
const scrape = require('./scrape');
const {onStart, onFinish} = require('./handle');

(async () => {
    const work = () => pMinDelay(scrape(conf.httpOptions), conf.minDelay);
    await onStart();
    await lavine([...Array(conf.concurrency)].fill(work), conf.concurrency);
    await onFinish();
})();
