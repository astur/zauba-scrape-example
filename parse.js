const load = require('cheerio').load;
module.exports = res => {
    const records = [];
    const urls = [];
    const $ = load(res.body);
    if(/\/[A-Z]$/.test(res.url)){
        const max = $('.pagination li a').last().attr('href').match(/\/(\d+)$/)[1];
        urls.push([res.url, max].join('/'));
    }
    $('.table-striped tr').slice(1, 4).each((i, el) => {
        const lines = $(el).find('td');
        records.push({
            cin: lines.eq(0).text(),
            name: lines.eq(1).text(),
            url: lines.eq(1).find('a').attr('href'),
            address: lines.eq(3).text(),
            pageUrl: res.url,
            ts: Date.now(),
        });
    });
    return {records, urls};
};
