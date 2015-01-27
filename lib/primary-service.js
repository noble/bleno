var events = require('events');
var util = require('util');

var debug = require('debug')('primary-service');

var BaseService = require('./base-service');

function PrimaryService(options) {
  PrimaryService.super_.call(this, options);
  this.primary = true;
  this.included = options.included || [];
}

util.inherits(PrimaryService, BaseService);

PrimaryService.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    characteristics: this.characteristics,
    included: this.included
  });
};

module.exports = PrimaryService;
