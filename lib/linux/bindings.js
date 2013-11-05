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

blenoBindings.onAdvertisingStart = function() {
  this.emit('advertisingStart');
};

blenoBindings.stopAdvertising = function() {
  this._advertising = false;

  this._hciBle.stopAdvertising();
};

blenoBindings.onAdvertisingStop = function() {
  this.emit('advertisingStop');
};

blenoBindings.onAccept = function(clientAddress) {
  debug('accepted ' + clientAddress);
};

blenoBindings.onDisconnect = function(clientAddress) {
  debug('disconnected ' + clientAddress);
  
  if (this._advertising) {
    this._hciBle.restartAdvertising();
  }
};

blenoBindings.setServices = function(services) {
  this._l2capBle.setServices(services || []);

  this.emit('servicesSet');
};

blenoBindings.init();

module.exports = blenoBindings;
