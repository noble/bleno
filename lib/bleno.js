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
  this.state = 'unknown';

  this._bindings = bindings;

  this._bindings.on('stateChange', this.onStateChange.bind(this));
  this._bindings.on('advertisingStart', this.onAdvertisingStart.bind(this));
  this._bindings.on('advertisingStop', this.onAdvertisingStop.bind(this));
  this._bindings.on('servicesSet', this.onServicesSet.bind(this));
}

util.inherits(Bleno, events.EventEmitter);

Bleno.prototype.PrimaryService = PrimaryService;
Bleno.prototype.Characteristic = Characteristic;
Bleno.prototype.Descriptor = Descriptor;

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

Bleno.prototype.startAdvertisingIBeacon = function(uuid, major, minor, measuredPower, callback) {
  var uuidData = new Buffer(uuid, 'hex');
  var uuidDataLength = uuidData.length;
  var iBeaconData = new Buffer(uuidData.length + 5);

  for (var i = 0; i < uuidDataLength; i++) {
    iBeaconData[i] = uuidData[i];
  }

  iBeaconData.writeUInt16BE(major, uuidDataLength);
  iBeaconData.writeUInt16BE(minor, uuidDataLength + 2);
  iBeaconData.writeInt8(measuredPower, uuidDataLength + 4);

  if (callback) {
    this.once('advertisingStart', callback);
  }

  debug('iBeacon data = ' + iBeaconData.toString('hex'));

  this._bindings.startAdvertisingIBeacon(iBeaconData);
};

Bleno.prototype.onAdvertisingStart = function(error) {
  debug('advertisingStart: ' + error);

  if (error) {
    this.emit('advertisingStartError', error);
  }

  this.emit('advertisingStart', error);
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
