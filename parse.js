module.exports = res => {
    const records = [];
    const urls = [];
    records.push({code: res.statusCode, url: res.url, ts: Date.now()});
    return {records, urls};
};
