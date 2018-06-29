const conf = require('oopt')('acC');

// -a - add targets
// -c - clear queue
// -C - clear data/error DB

conf.targets = ['https://www.zaubacorp.com/companybrowse/Xa'];
// conf.targets = [...Array(26).keys()].map(i => `https://www.zaubacorp.com/companybrowse/${String.fromCharCode(i + 'A'.charCodeAt(0))}`);

conf.concurrency = 10;
conf.waitForActive = 500;
conf.startDt = Date.now();
conf.mongoString = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
conf.validate = {codes: 200, bodyMatch: /<\/html>/};
conf.save = {
    data: {
        index: 'url',
        cleanErrors: conf.C,
        cleanValid: conf.C,
    },
    log: {
        valid: 'log',
        errors: 'logerrors',
        index: 'startDt',
        check: () => true,
    },
};

module.exports = conf;
