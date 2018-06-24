const conf = require('oopt')('acC');
conf.concurrency = 10;
conf.waitForActive = 500;
module.exports = conf;
