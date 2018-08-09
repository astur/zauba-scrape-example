const conf = require('./conf');
const db = require('./db');
const q = require('./queue');
const scra = require('scra');
const validate = require('validate-response')(conf.validate);
const parse = require('./parse');
const transform = require('./transform');
const check = require('./check')(db);
const save = require('monscr')(db, conf.save.data);

module.exports = async options => {
    const {data: url, tag} = await q.get();

    try {
        const response = await scra({...options, url});
        const result = {
            requestTime: response.requestTime,
            bytesSent: response.bytes.sent,
            bytesReceived: response.bytes.received,
        };
        await validate(response);
        const parsed = await parse(response);

        const records = await transform(parsed.records);
        const urls = await check(parsed.urls);

        await q.ping(tag);
        const saved = await save(records);
        await q.add(urls);
        await q.ack(tag);

        return {url, result: {...result, ...saved}};
    } catch(e){
        if(/mongo/i.test(e.name)) throw e;
        await q.ack(tag);
        throw e;
    }
};
