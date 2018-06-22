const log = require('cllc')(null, '%F %T');
const errsome = require('errsome');
const mongo = require('mongodb').MongoClient;
const mongoString = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
module.exports = mongo.connect(mongoString).then(client => {
    if('databaseName' in client) return client;
    const db = client.db(mongoString.split('/').pop());
    db.close = client.close.bind(client);
    return db;
}).catch(e => {
    log.e('\n', errsome(e));
    process.exit(1);
});
