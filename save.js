const conf = require('./conf');
const db = require('./db');
const monscr = require('monscr');
module.exports = monscr(db, conf.save.data);
module.exports.saveLog = monscr(db, conf.save.log);
