const conf = require('oopt')('acC');
const errsome = require('errsome');
const log = require('cllc')(null, '%F %T');
const scra = require('scra');
const ce = require('c-e');
const assign = (...objs) => Object.assign({}, ...objs);

const mongo = require('mongodb').MongoClient;
const mongoString = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
const db = mongo.connect(mongoString).then(client => {
    if('databaseName' in client) return client;
    const db = client.db(mongoString.split('/').pop());
    db.close = client.close.bind(client);
    return db;
}).catch(e => {
    log.e('\n', errsome(e));
    process.exit(1);
});

const targets = [
    'https://www.zaubacorp.com/companybrowse/A',
    'https://www.zaubacorp.com/companybrowse/B',
    'https://www.zaubacorp.com/companybrowse/C',
];

const validate = require('validate-response')({
    codes: 200,
    bodyMatch: /<\/html>/,
});
const save = require('monscr')(db, {
    index: 'url',
    cleanErrors: conf.C,
    cleanValid: conf.C,
});
const q = require('mq-mongo')(db, {
    name: `mq_zauba`,
    items: conf.a ? targets : null,
    clean: conf.c,
});

const options = {
    timeout: 10000,
    compressed: true,
};

const parse = res => ({records: [{code: res.statusCode, url: res.url}]});

const scrape = async () => {
    const {data: url, tag} = await q.get().then(async task => {
        if(task !== null) return task;
        const e = new (ce('QueueGetError'))('Unable to get task from queue');
        e.stats = await q.stats();
        throw e;
    });

    const response = await scra(Object.assign({}, options, {url}));
    const result = {
        requestTime: response.requestTime,
        bytesSent: response.bytes.sent,
        bytesReceived: response.bytes.received,
    };
    await validate(response);
    const parsed = await parse(response);

    // const records = await transform(parsed.records);
    // const urls = await check(parsed.urls);

    await q.ping(tag);
    const saved = await save(parsed.records);
    await q.add(parsed.urls);
    await q.ack(tag);

    return {url, result: assign(result, saved)};
};

scrape().then(s => log.i(s), e => log.e('\n', errsome(e))).then(async () => (await db).close());

// const work = (conf) => scrape(conf).then(onSuccess, onError);
// dispatcher(work, {options}).then(onFinish);
