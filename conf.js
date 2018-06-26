const conf = require('oopt')('acCz');

// -a - add targets
// -c - clear queue
// -C - clear data/error DB
// -z - leave failed tasks in db

conf.concurrency = 10;
conf.waitForActive = 500;
conf.startDt = Date.now();
conf.mongoString = process.env.MONGO_URI || 'mongodb://localhost:27017/test';

module.exports = conf;
