var events = require('events');
var util = require('util');

var debug = require('debug')('secondary-service');

var BaseService = require('./base-service');

function SecondaryService(options) {
  SecondaryService.super_.call(this, options);
}

util.inherits(SecondaryService, BaseService);

SecondaryService.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    characteristics: this.characteristics
  });
};

module.exports = SecondaryService;
