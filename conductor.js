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

const offDead = onDeath(() => { // signal, err
    if(dieing) return;
    dieing = true;
    abbado.stop();
    timer = setTimeout(() => {
        // log
        process.exit();
    }, conf.waitForExit);
});

abbado.cleanup = () => {
    clearTimeout(timer);
    offDead();
};

module.exports = abbado;
