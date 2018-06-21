const test = require('ava');
const m = require('.');

test('fake', t => {
    t.log('this is a fake test');
    t.true(true);
    t.is(m, m);
});
