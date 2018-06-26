const conf = require('./conf');
const log = require('cllc')(null, '%F %T');
const errsome = require('errsome');
const mongo = require('mongodb').MongoClient;
module.exports = mongo.connect(conf.mongoString).then(client => {
    if('databaseName' in client) return client;
    const db = client.db(conf.mongoString.split('/').pop());
    db.close = client.close.bind(client);
    return db;
}).catch(e => {
    log.e('\n', errsome(e));
    process.exit(1);
});
