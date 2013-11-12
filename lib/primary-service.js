var events = require('events');
var util = require('util');

var debug = require('debug')('primary-service');

function PrimaryService(options) {
  this.uuid = options.uuid;
  this.characteristics = options.characteristics || [];
}

util.inherits(PrimaryService, events.EventEmitter);

PrimaryService.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    characteristics: this.characteristics
  });
};

module.exports = PrimaryService;
