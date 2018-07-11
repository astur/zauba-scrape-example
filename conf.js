const conf = require('oopt')('act:l:');

// -a - add targets
// -c - clear data/error DB
// -t - scrape maxTime in ms
// -l - scrape maxTasks

conf.maxTime = +conf.t || null;
conf.maxTasks = +conf.l || null;

conf.targets = ['https://www.zaubacorp.com/companybrowse/Xa'];
// conf.targets = [...Array(26).keys()].map(i => `https://www.zaubacorp.com/companybrowse/${String.fromCharCode(i + 'A'.charCodeAt(0))}`);

conf.id = 'zauba';
conf.concurrency = 10;
conf.waitForActive = 500;
conf.waitAfterTimeoutError = 10000;
conf.startDt = Date.now();
conf.mongoString = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
conf.validate = {codes: 200, bodyMatch: /<\/html>/};
conf.save = {
    data: {
        index: 'url',
        cleanErrors: conf.c,
        cleanValid: conf.c,
    },
    log: {
        valid: 'log',
        errors: 'logerrors',
        index: 'startDt',
        check: () => true,
    },
};
conf.queue = {
    name: `mq_${conf.id}`,
    clean: conf.c,
    strict: true,
    tries: 1,
};
conf.httpOptions = {
    timeout: 10000,
    compressed: true,
};

module.exports = conf;
