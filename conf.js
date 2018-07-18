const conf = require('oopt')('act:l:e:E:p');

// -a - add targets
// -c - clear data/error DB
// -t - scrape maxTime in ms
// -l - scrape maxTasks
// -E - scrape maxErrors
// -e - scrape maxTagErrors
// -p - use proxy list

conf.maxTime = +conf.t || null;
conf.maxTasks = +conf.l || null;
conf.maxErrors = +conf.E || null;
conf.maxTagErrors = +conf.e || null;

conf.targets = ['https://www.zaubacorp.com/companybrowse/X'];
// conf.targets = [...Array(26).keys()].map(i => `https://www.zaubacorp.com/companybrowse/${String.fromCharCode(i + 'A'.charCodeAt(0))}`);

conf.id = 'zauba';
conf.concurrency = 10;
conf.waitForActive = 500;
conf.waitAfterTimeoutError = 10000;
conf.waitForExit = 5000;
conf.minDelay = 500;
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
        errors: 'log',
        index: 'startDt',
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
conf.proxyList = [...Array(conf.concurrency)].map((_, i) => `http://localhost:${3100 + i}`);

module.exports = conf;
