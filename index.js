const conf = require('./conf');
const errsome = require('errsome');
const log = require('cllc')(null, '%F %T');
const whiler = require('whiler');

const scrape = require('./scrape');
const {onSuccess, onError, onFinish} = require('./handle');

const work = () => scrape(conf.httpOptions).then(onSuccess, onError);

log.start('[ %s - pages scraped]');

Promise.all([...Array(conf.concurrency)].map(() => whiler(work))).then(onFinish).catch(e => log.e('\n', errsome(e)));
