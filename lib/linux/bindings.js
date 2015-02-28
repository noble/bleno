var debug = require('debug')('bleno-bindings');

var events = require('events');
var util = require('util');

var noble = require('noble');
noble._discoveredPeripheralUUids = [];
var NobleL2capBle = require('noble/lib/linux/l2cap-ble');

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

  // '000000000000'
  // noble._bindings.onDiscover(clientAddress, 'random', {}, 127);
  noble._bindings._hciBle.emit('discover', clientAddress, 'random', {}, 127);
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

//////////////////////////////////////////////////////////

noble._discoveredPeripheralUUids = [];
noble._allowDuplicates = true;

noble._bindings._scanServiceUuids = [];

NobleL2capBle.prototype.connect = function() {
  console.log('bleno - overrided noble connect!');

  this._buffer = "";

  this._l2capBle = blenoBindings._l2capBle._l2capBle;

  this._l2capBle.stdout.on('data', this.onStdoutData.bind(this));

  this.emit('connect', this._address, null);
};

NobleL2capBle.prototype.kill = function() {
  console.log('bleno - overrided noble kill!');

  // this._l2capBle.stdout.removeListener('data', this.onStdoutData.bind(this));
  this._l2capBle.stdout.removeListener('data', this._l2capBle.stdout.listeners('data')[1]);
  this._l2capBle = null;
};
//////////////////////////////////////////////////////////

module.exports = blenoBindings;
