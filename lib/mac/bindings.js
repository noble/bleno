/*jshint loopfunc: true */

var debug = require('debug')('bindings');

var events = require('events');
var os = require('os');
var util = require('util');

var CoreBluetooth         = require('core-bluetooth');

var MutableService        = require('./mutable-service');

var osRelease = parseFloat(os.release());

var BlenoBindings = function() {
  this._deviceUUID = null;
  this._services = [];
};

util.inherits(BlenoBindings, events.EventEmitter);

BlenoBindings.prototype.startAdvertising = function(name, serviceUuids) {
  this._peripheralManager.startAdvertising({
    localName: name,
    serviceUuids: serviceUuids
  });
};

BlenoBindings.prototype.startAdvertisingIBeacon = function(data) {
  var args = {};

  if (osRelease >= 14) {
    args.appleMfgData = Buffer.concat([
      new Buffer([data.length + 5, 0xff, 0x4c, 0x00, 0x02, data.length]),
      data
    ]);
  } else {
    args.appleBeacon = data;
  }

  this._peripheralManager.startAdvertising(args);
};

BlenoBindings.prototype.startAdvertisingWithEIRData = function(advertisementData) {
  if (osRelease < 14) {
    throw new Error('startAdvertisingWithEIRData is only supported on OS X 10.10 and above!');
  }

  this._peripheralManager.startAdvertising({
    appleMfgData: advertisementData
  });
};

BlenoBindings.prototype.stopAdvertising = function() {
  this._peripheralManager.stopAdvertising();

  this.emit('advertisingStop');
};

BlenoBindings.prototype.setServices = function(services) {
  this._peripheralManager.removeAllServices();

  services = services || [];
  var attributeId = 1;

  this._attributes = [];
  this._setServicesError = undefined;

  if (services.length) {
    this._services = [];

    for (var i = 0; i < services.length; i++) {
      this._services[i] = new MutableService(services[i]);

      this._peripheralManager.addService(this._services[i]);
    }
  } else {
    this._services = [];
    this.emit('servicesSet');
  }
};

BlenoBindings.prototype.updateRssi = function() {

};

BlenoBindings.prototype.disconnect = function() {
  throw new Error('disconnect is not supported on OS X!');
};

BlenoBindings.prototype.init = function() {
  this._peripheralManager = new CoreBluetooth.PeripheralManager();

  this._peripheralManager.on('address', this._onAddress.bind(this));
  this._peripheralManager.on('stateUpdate', this._onStateUpdate.bind(this));
  this._peripheralManager.on('advertisingStart', this._onAdvertisingStart.bind(this));
  this._peripheralManager.on('serviceAdded', this._onServiceAdded.bind(this));
  this._peripheralManager.on('accept', this._onAccept.bind(this));
  this._peripheralManager.on('mtuChange', this._onMtuChange.bind(this));
};

BlenoBindings.prototype._onAddress = function(addresss) {
  this.emit('addressChange', addresss);
};

BlenoBindings.prototype._onStateUpdate = function(state) {
  this.emit('stateChange', state);
};

BlenoBindings.prototype._onAdvertisingStart = function(error) {
  this.emit('advertisingStart', error);
};

BlenoBindings.prototype._onServiceAdded = function(service, error) {
  if (error) {
    this._setServicesError = error;
  }

  if (service === this._services[this._services.length - 1]) {
    this.emit('servicesSet',  this._setServicesError);
  }
};

BlenoBindings.prototype._onAccept = function(centralIdentifier, address) {
  this.emit('accept', address);
};

BlenoBindings.prototype._onMtuChange = function(mtu) {
  this.emit('mtuChange', mtu);
};

module.exports = new BlenoBindings();
