var debug = require('debug')('bleno');

var events = require('events');
var os = require('os');
var util = require('util');

var PrimaryService = require('./primary-service');
var Characteristic = require('./characteristic');
var Descriptor = require('./descriptor');

var bindings = null;

var platform = os.platform();

if (platform === 'darwin') {
  bindings = require('./mac/bindings');
} else if (platform === 'linux') {
  bindings = require('./linux/bindings');
} else {
  throw new Error('Unsupported platform');
}

function Bleno() {
  this.PrimaryService = PrimaryService;
  this.Characteristic = Characteristic;
  this.Descriptor = Descriptor;

  this.state = 'unknown';

  this._bindings = bindings;

  this._bindings.on('stateChange', this.onStateChange.bind(this));
  this._bindings.on('advertisingStart', this.onAdvertisingStart.bind(this));
  this._bindings.on('advertisingStop', this.onAdvertisingStop.bind(this));
  this._bindings.on('servicesSet', this.onServicesSet.bind(this));
}

util.inherits(Bleno, events.EventEmitter);

Bleno.prototype.onStateChange = function(state) {
  debug('stateChange ' + state);

  this.state = state;

  this.emit('stateChange', state);
};

Bleno.prototype.startAdvertising = function(name, serviceUuids, callback) {
  if (callback) {
    this.once('advertisingStart', callback);
  }
  this._bindings.startAdvertising(name, serviceUuids);
};

Bleno.prototype.onAdvertisingStart = function() {
  debug('advertisingStart');
  this.emit('advertisingStart');
};

Bleno.prototype.stopAdvertising = function(callback) {
  if (callback) {
    this.once('advertisingStop', callback);
  }
  this._bindings.stopAdvertising();
};

Bleno.prototype.onAdvertisingStop = function() {
  debug('advertisingStop');
  this.emit('advertisingStop');
};

Bleno.prototype.setServices = function(services, callback) {
  if (callback) {
    this.once('servicesSet', callback);
  }
  this._bindings.setServices(services);
};

Bleno.prototype.onServicesSet = function() {
  debug('servicesSet');
  this.emit('servicesSet');
};

module.exports = Bleno;
