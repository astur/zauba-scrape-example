const conf = require('./conf');

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

const _summary = () => {
    const sum = summary();
    return {
        src: conf.id,
        startDt: new Date(conf.startDt),
        endDt: new Date(),
        parseDuration: Math.ceil((Date.now() - conf.startDt) / 1000),
        result: {
            status: 'ok',
            message: '',
        },
        newAds: sum.inserted,
        updatedAds: sum.modified,
        duplicatedAds: sum.duplicated,
        successAds: sum.inserted + sum.modified + sum.duplicated,
        rejectedAds: sum.errors,
        requestCountSuccess: sum.requestCountSuccess,
        requestCountError: sum.requestCountError,
        requestCountTotal: sum.requestCountSuccess + sum.requestCountError,
        bytesSent: sum.bytesSent,
        bytesReceived: sum.bytesReceived,
        requestTimeMin: sum.requestTime.min,
        requestTimeMax: sum.requestTime.max,
        requestTimeAvg: sum.requestTime.avg,
        requestTime95Percentile: sum.requestTime.quantile['0.95'],
    };
};

module.exports = {collect, summary: _summary};
