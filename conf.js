const conf = require('oopt')('act:l:e:E:pv');

// -a - add targets
// -c - clear data/error DB
// -t - scrape maxTime in ms
// -l - scrape maxTasks
// -E - scrape maxErrors
// -e - scrape maxTagErrors
// -p - use proxy list
// -v - more informative log
// [] - add partial targets

conf.maxTime = +conf.t || null;
conf.maxTasks = +conf.l || null;
conf.maxErrors = +conf.E || null;
conf.maxTagErrors = +conf.e || null;

if(conf.a){
    conf.targets = [...Array(26).keys()]
        .map(i => `https://www.zaubacorp.com/companybrowse/${String.fromCharCode(i + 'A'.charCodeAt(0))}`);
} else if(conf._ && conf._.length){
    const slugs = conf._.filter(s => /^[a-zA-Z]{1,5}$/.test(s));
    conf.targets = slugs.map(s => `https://www.zaubacorp.com/companybrowse/${s}`);
}

conf.id = 'zauba';
conf.concurrency = 20;
conf.waitForActive = 500;
conf.waitAfterError = 10000;
conf.waitForExit = 5000;
conf.minDelay = 50;
conf.mongoString = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
conf.validate = {codes: 200, bodyMatch: /<\/html>/};
conf.save = {
    data: {
        valid: `data_${conf.id}`,
        errors: `errors_${conf.id}`,
        index: 'url',
        cleanErrors: conf.c,
        cleanValid: conf.c,
    },
    log: {
        valid: `log_${conf.id}`,
        errors: `log_${conf.id}`,
        index: 'startDt',
    },
};
conf.queue = {
    name: `mq_${conf.id}`,
    clean: !!conf.targets,
    strict: true,
    tries: 1,
};
conf.httpOptions = {
    timeout: 10000,
    compressed: true,
};
if(conf.p){
    conf.proxyList = [...Array(conf.concurrency)].map((_, i) => `http://localhost:${3100 + i}`);
}

module.exports = conf;
