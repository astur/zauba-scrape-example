const conf = require('./conf');
const whiler = require('whiler');
const pMinDelay = require('p-min-delay');

const scrape = require('./scrape');
const {onSuccess, onError, onStart, onFinish} = require('./handle');

const work = () => pMinDelay(scrape(conf.httpOptions).then(onSuccess, onError), 500);
const flow = () => Promise.all([...Array(conf.concurrency)].map(() => whiler(work)));

onStart().then(flow).then(onFinish);
