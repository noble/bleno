var events = require('events');
var util = require('util');

var debug = require('debug')('base-service');

var UuidUtil = require('./uuid-util');

function BaseService(options) {
  this.uuid = UuidUtil.removeDashes(options.uuid);
  this.characteristics = options.characteristics || [];
}

util.inherits(BaseService, events.EventEmitter);

module.exports = BaseService;
