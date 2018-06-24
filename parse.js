const load = require('cheerio').load;
module.exports = res => {
    const records = [];
    const urls = [];
    const $ = load(res.body);
    records.push({
        code: res.statusCode,
        title: $('title').text(),
        url: res.url,
        ts: Date.now(),
    });
    return {records, urls};
};
