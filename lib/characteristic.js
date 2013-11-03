var events = require('events');
var util = require('util');

var debug = require('debug')('characteristic');

function Characteristic(options) {
  this.uuid = options.uuid;
  this.properties = options.properties || [];
  this.value = options.value;
  this.descriptors = options.descriptors || [];

  if (options.onReadRequest) {
    this.onReadRequest = options.onReadRequest;
  }

  if (options.onWriteRequest) {
    this.onWriteRequest = options.onWriteRequest;
  }

  this.on('readRequest', this.onReadRequest.bind(this));
  this.on('writeRequest', this.onWriteRequest.bind(this));
}

util.inherits(Characteristic, events.EventEmitter);

Characteristic.prototype.RESULT_SUCCESS                  = 0x00;
Characteristic.prototype.RESULT_INVALID_OFFSET           = 0x07;
Characteristic.prototype.RESULT_INVALID_ATTRIBUTE_LENGTH = 0x0d;
Characteristic.prototype.RESULT_UNLIKELY_ERROR           = 0x0e;

Characteristic.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    properties: this.properties,
    value: this.value,
    descriptors: this.descriptors
  });
};

Characteristic.prototype.onReadRequest = function(offset, callback) {
  callback(this.RESULT_UNLIKELY_ERROR, null);
};

Characteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
  callback(this.RESULT_UNLIKELY_ERROR, null);
};

module.exports = Characteristic;
