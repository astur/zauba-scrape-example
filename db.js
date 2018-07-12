const conf = require('./conf');
const log = require('cllc')(null, '%F %T');
const mongo = require('mongodb').MongoClient;
module.exports = mongo.connect(conf.mongoString, {useNewUrlParser: true}).then(client => {
    if('databaseName' in client) return client;
    const db = client.db(conf.mongoString.split('/').pop());
    db.close = client.close.bind(client);
    return db;
}).catch(e => {
    log.e(e);
    process.exit(1);
});
