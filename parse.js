module.exports = res => {
    const records = [];
    const urls = [];
    try {
        if(/\/[A-Z]$/.test(res.url)){
            const max = res.body.match(/pagination">.*href="\/companybrowse\/\w+\/(\d+)"><span aria-hidden/)[1];
            urls.push(...[...Array(+max + 1).keys()].slice(2).map(i => [res.url, i].join('/')));
        }
        if(/companybrowse/.test(res.url)){
            const _ = res.body.match(/<table.*<\/table/)[0];
            urls.push(..._.match(/href="([^"]+)"/g).map(s => s.match(/href="([^"]+)"/)[1]));
        }
        if(/company\//.test(res.url)){
            records.push({
                url: res.url,
                name: (res.body.match(/>Home<\/a>.{3}([^<]+)</) || [])[1] || null,
                asOnDate: (res.body.match(/width:45%;"><b>As on: ([^<]+) <\/b/) || [])[1] || null,
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
