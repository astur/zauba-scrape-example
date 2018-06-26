const load = require('cheerio').load;
module.exports = res => {
    const records = [];
    const urls = [];
    try {
        const $ = load(res.body);
        if(/\/[A-Z]$/.test(res.url)){
            const max = $('.pagination li a').last().attr('href').match(/\/(\d+)$/)[1];
            urls.push(...[...Array(+max + 1).keys()].slice(2).map(i => [res.url, i].join('/')));
        }
        if(/companybrowse/.test(res.url)){
            $('.table-striped a').each((i, el) => {
                urls.push($(el).attr('href'));
            });
        }
        if(/company\//.test(res.url)){
            records.push({
                url: res.url,
                name: $('.breadcrumb').text().split(/\u203a/)[1].trim(),
                asOnDate: $('[style$="width:45%;"]').text().split(':')[1].trim(),
                cin: res.url.split('/').pop(),
                email: (res.body.match(/Email ID: <\/b>([^-<][^<]+)<\/p>/) || [])[1] || null,
                address: (res.body.match(/Address: <\/b><\/p><p>([^<]+)<\/br>/) || [])[1] || null,
            });
        }
    } catch(e){
        const err = new Error('Can\'t parse response');
        err.name = 'ParseError';
        err.cause = e;
        err.url = res.url;
        err.status = res.statusCode;
        err.headers = res.headers;
        err.bodyLength = res.body.length;
        throw err;
    }
    return {records, urls};
};
