const events = require('events');
const util = require('util');

const BlenoMac = require('./native/binding').BlenoMac;

util.inherits(BlenoMac, events.EventEmitter);

module.exports = new BlenoMac();
