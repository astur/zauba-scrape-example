const {id} = require('./conf');
const startDt = Date.now();

const {collect, summary} = require('summary-collector')({
    counters: [
        'bytesSent',
        'bytesReceived',
        'inserted',
        'modified',
        'duplicated',
        'errors',
        'requestCountSuccess',
        'requestCountError',
    ],
    quantile: 0.95,
});

const _summary = arg => {
    const sum = summary();
    const result = {
        src: id,
        startDt: new Date(startDt),
        endDt: new Date(),
        parseDuration: Math.ceil((Date.now() - startDt) / 1000),
        result: arg || {status: 'ok'},
    };
    if(sum.requestCountSuccess > 0){
        result.requestCountTotal = sum.requestCountSuccess + sum.requestCountError;
        result.requestCountSuccess = sum.requestCountSuccess;
        result.requestCountError = sum.requestCountError;
        result.bytesSent = sum.bytesSent;
        result.bytesReceived = sum.bytesReceived;
        result.requestTimeMin = sum.requestTime.min;
        result.requestTimeMax = sum.requestTime.max;
        result.requestTimeAvg = sum.requestTime.avg;
        result.requestTime95Percentile = sum.requestTime.quantile['0.95'];
        result.newAds = sum.inserted;
        result.updatedAds = sum.modified;
        result.duplicatedAds = sum.duplicated;
        result.successAds = sum.inserted + sum.modified + sum.duplicated;
        result.rejectedAds = sum.errors;
    }
    return result;
};

module.exports = {collect, summary: _summary};
