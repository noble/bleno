var events = require('events');
var util = require('util');

var BlenoMac = require('./native/binding').BlenoMac;

util.inherits(BlenoMac, events.EventEmitter);

module.exports = new BlenoMac();
