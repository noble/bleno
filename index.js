var Bleno = require('./lib/bleno');
var bindings = require('./lib/resolve-bindings')();

module.exports = new Bleno(bindings);
