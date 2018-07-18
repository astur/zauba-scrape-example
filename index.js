const conf = require('./conf');
const lavine = require('lavine');
const pMinDelay = require('p-min-delay');

const scrape = require('./scrape');
const {onSuccess, onError, onStart, onFinish} = require('./handle');

const work = () => pMinDelay(scrape(conf.httpOptions).then(onSuccess, onError), conf.minDelay);
const flows = [...Array(conf.concurrency)].fill(work);

onStart().then(() => lavine(flows, conf.concurrency)).then(onFinish);
