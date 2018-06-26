module.exports = records => records.map(r => {
    const errors = [];
    if(r.email === null) errors.push('no email');
    if(r.address === null) errors.push('no address');
    if(errors.length) r.errors = errors;
    return r;
});
