var debug = require('debug')('bindings');

var events = require('events');
var util = require('util');

var HciBle = require('./hci-ble');
var L2capBle = require('./l2cap-ble');

var BlenoBindings = function() {
  this._advertising = false;

  this._hciBle = new HciBle();
  this._l2capBle = new L2capBle();
};

util.inherits(BlenoBindings, events.EventEmitter);

var blenoBindings = new BlenoBindings();

blenoBindings.init = function() {
  this._hciBle.on('stateChange', this.onStateChange.bind(this));
  this._hciBle.on('advertisingStart', this.onAdvertisingStart.bind(this));
  this._hciBle.on('advertisingStop', this.onAdvertisingStop.bind(this));

  this._l2capBle.on('accept', this.onAccept.bind(this));
  this._l2capBle.on('disconnect', this.onDisconnect.bind(this));

  this._l2capBle.on('rssiUpdate', this.onRssiUpdate.bind(this));
};

blenoBindings.onStateChange = function(state) {
  this.emit('stateChange', state);
};

blenoBindings.startAdvertising = function(name, serviceUuids) {
  this._advertising = true;

  this._hciBle.startAdvertising(name, serviceUuids);
};

blenoBindings.startAdvertisingIBeacon = function(data) {
  this._advertising = true;

  this._hciBle.startAdvertisingIBeacon(data);
};

blenoBindings.startAdvertisingWithEIRData = function(advertisementData, scanData) {
  this._advertising = true;

  this._hciBle.startAdvertisingWithEIRData(advertisementData, scanData);
};

blenoBindings.onAdvertisingStart = function(error) {
  this.emit('advertisingStart', error);
};

blenoBindings.stopAdvertising = function() {
  this._advertising = false;

  this._hciBle.stopAdvertising();
};

blenoBindings.onAdvertisingStop = function() {
  this.emit('advertisingStop');
};

blenoBindings.onAccept = function(clientAddress) {
  debug('accept ' + clientAddress);
  this.emit('accept', clientAddress);
};

blenoBindings.onDisconnect = function(clientAddress) {
  debug('disconnected ' + clientAddress);
  
  this.emit('disconnect', clientAddress);

  if (this._advertising) {
    this._hciBle.restartAdvertising();
  }
};

blenoBindings.setServices = function(services) {
  this._l2capBle.setServices(services || []);

  this.emit('servicesSet');
};

blenoBindings.disconnect = function() {
  debug('disconnect by server');
  this._l2capBle.disconnect();
};

blenoBindings.updateRssi = function() {
  this._l2capBle.updateRssi();
};

blenoBindings.onRssiUpdate = function(rssi) {
  this.emit('rssiUpdate', rssi);
};

blenoBindings.init();

module.exports = blenoBindings;
