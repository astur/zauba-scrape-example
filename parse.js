const load = require('cheerio').load;
module.exports = res => {
    const records = [];
    const urls = [];
    const $ = load(res.body);
    if(/\/[A-Z]$/.test(res.url)){
        const max = $('.pagination li a').last().attr('href').match(/\/(\d+)$/)[1];
        urls.push(...[...Array(+max + 1).keys()].slice(2).map(i => [res.url, i].join('/')));
        // urls.push(...[2, max].map(i => [res.url, i].join('/')));
        // urls.push([res.url, max].join('/'));
    }
    if(/companybrowse/.test(res.url)){
        // $('.table-striped a').slice(0, 3).each((i, el) => {
        $('.table-striped a').each((i, el) => {
            urls.push($(el).attr('href'));
        });
    }
    if(/company\//.test(res.url)){
        records.push({
            url: res.url,
            name: $('.breadcrumb').text().split(/\u203a/)[1].trim(),
        });
    }
    // $('.table-striped tr').slice(1, 4).each((i, el) => {
    //     const lines = $(el).find('td');
    //     records.push({
    //         cin: lines.eq(0).text(),
    //         name: lines.eq(1).text(),
    //         url: lines.eq(1).find('a').attr('href'),
    //         address: lines.eq(3).text(),
    //         pageUrl: res.url,
    //         ts: Date.now(),
    //     });
    // });
    return {records, urls};
};
