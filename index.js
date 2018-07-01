const conf = require('./conf');
const errsome = require('errsome');
const log = require('cllc')(null, '%F %T');
const whiler = require('whiler');

const scrape = require('./scrape');
const {onSuccess, onError, onStart, onFinish} = require('./handle');

const work = () => scrape(conf.httpOptions).then(onSuccess, onError);
const flow = () => Promise.all([...Array(conf.concurrency)].map(() => whiler(work)));

onStart().then(flow).then(onFinish).catch(e => log.e('\n', errsome(e)));
