const conf = require('./conf');
const abbado = require('abbado')({
    timeout: conf.maxTime,
    count: conf.maxTasks,
    errorLimit: conf.maxErrors,
    tagErrorLimit: conf.maxTagErrors,
});

module.exports = abbado;
