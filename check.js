const db = require('./db');
module.exports = async urls => {
    if(urls.length === 0) return [];
    const found = (await (await db).collection('data')
        .find({url: {$in: urls}}).toArray())
        .map(v => v.url);
    return urls.filter(v => !found.includes(v));
};
