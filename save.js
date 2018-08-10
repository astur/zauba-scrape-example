const {save} = require('./conf');
const db = require('./db');
const monscr = require('monscr');
module.exports = monscr(db, save.data);
module.exports.saveLog = monscr(db, save.log);
