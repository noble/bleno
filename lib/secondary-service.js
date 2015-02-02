var events = require('events');
var util = require('util');

var debug = require('debug')('secondary-service');

var UuidUtil = require('./uuid-util');

function SecondaryService(options) {
  this.uuid = UuidUtil.removeDashes(options.uuid);
  this.characteristics = options.characteristics || [];
  this.absoluteHandle = options.absoluteHandle;
  this.relativeHandle = options.relativeHandle;
  this.ID = options.ID || null;
  this.included = options.included || [];
  this.isSecondary = true;
}

util.inherits(SecondaryService, events.EventEmitter);

SecondaryService.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    characteristics: this.characteristics
  });
};

module.exports = SecondaryService;
