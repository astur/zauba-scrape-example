const conf = require('./conf');
const whiler = require('whiler');

const scrape = require('./scrape');
const {onSuccess, onError, onStart, onFinish} = require('./handle');

const work = () => scrape(conf.httpOptions).then(onSuccess, onError);
const flow = () => Promise.all([...Array(conf.concurrency)].map(() => whiler(work)));

onStart().then(flow).then(onFinish);
