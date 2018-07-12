const conf = require('./conf');
const onDeath = require('death');
const abbado = require('abbado')({
    timeout: conf.maxTime,
    count: conf.maxTasks,
    errorLimit: conf.maxErrors,
    tagErrorLimit: conf.maxTagErrors,
});

let dieing = false;
let timer = null;

const offDead = onDeath((signal, err) => {
    if(dieing) return;
    dieing = true;
    abbado.stop(err ? {
        status: 'error',
        error: err.name,
        message: err.message,
    } : {
        status: 'aborted',
        signal,
    });
    timer = setTimeout(() => {
        process.exit();
    }, conf.waitForExit);
});

abbado.cleanup = () => {
    clearTimeout(timer);
    offDead();
};

module.exports = abbado;
