const {maxTime, maxTasks, maxErrors, maxTagErrors, waitForExit} = require('./conf');
const onDeath = require('death');
const abbado = require('abbado')({
    timeout: maxTime,
    count: maxTasks,
    errorLimit: maxErrors,
    tagErrorLimit: maxTagErrors,
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
    }, waitForExit);
});

abbado.cleanup = () => {
    abbado.resume();
    clearTimeout(timer);
    offDead();
};

module.exports = abbado;
