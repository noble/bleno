var debug = require('debug')('bindings');

var events = require('events');
var util = require('util');

var AclStream = require('./acl-stream');
var Hci = require('./hci');
var Gap = require('./gap');
var Gatt = require('./gatt');

var BlenoBindings = function() {
  this._advertising = false;

  this._hci = new Hci();
  this._gap = new Gap(this._hci);
  this._gatt = new Gatt(this._hci);

  this._address = null;
  this._handle = null;
  this._aclStream = null;
};

util.inherits(BlenoBindings, events.EventEmitter);

BlenoBindings.prototype.startAdvertising = function(name, serviceUuids) {
  this._advertising = true;

  this._gap.startAdvertising(name, serviceUuids);
};

BlenoBindings.prototype.startAdvertisingIBeacon = function(data) {
  this._advertising = true;

  this._gap.startAdvertisingIBeacon(data);
};

BlenoBindings.prototype.startAdvertisingWithEIRData = function(advertisementData, scanData) {
  this._advertising = true;

  this._gap.startAdvertisingWithEIRData(advertisementData, scanData);
};


BlenoBindings.prototype.stopAdvertising = function() {
  this._advertising = false;

  this._gap.stopAdvertising();
};

BlenoBindings.prototype.setServices = function(services) {
  this._gatt.setServices(services);

  this.emit('servicesSet');
};

BlenoBindings.prototype.disconnect = function() {
  debug('disconnect by server');

  var HCI_OE_USER_ENDED_CONNECTION = 0x13;

  this._hci.disconnect(this._handle, HCI_OE_USER_ENDED_CONNECTION);
};

BlenoBindings.prototype.updateRssi = function() {
  this._hci.readRssi(this._handle);
};


BlenoBindings.prototype.init = function() {
  this._gap.on('advertisingStart', this.onAdvertisingStart.bind(this));
  this._gap.on('advertisingStop', this.onAdvertisingStop.bind(this));

  this._gatt.on('mtu', this.onMtu.bind(this));

  this._hci.on('stateChange', this.onStateChange.bind(this));

  this._hci.on('leConnComplete', this.onLeConnComplete.bind(this));
  this._hci.on('leConnUpdateComplete', this.onLeConnUpdateComplete.bind(this));
  this._hci.on('rssiRead', this.onRssiRead.bind(this));
  this._hci.on('disconnComplete', this.onDisconnComplete.bind(this));
  this._hci.on('encryptChange', this.onEncryptChange.bind(this));
  this._hci.on('aclDataPkt', this.onAclDataPkt.bind(this));

  this._hci.init();

  process.nextTick(function() {
    this.emit('addressChange', this._hci.address);
  }.bind(this));
};

BlenoBindings.prototype.onStateChange = function(state) {
  if (state === 'unauthorized') {
    console.log('bleno warning: adapter state unauthorized, please run as root or with sudo');
    console.log('               or see README for information on running without root/sudo:');
    console.log('               https://github.com/sandeepmistry/bleno#running-on-linux');
  } else if (state === 'unsupported') {
    console.log('bleno warning: adapter does not support Bluetooth Low Energy (BLE, Bluetooth Smart).');
    console.log('               Try to run with environment variable:');
    console.log('               [sudo] BLENO_HCI_DEVICE_ID=x node ...');
  }

  this.emit('stateChange', state);
};

BlenoBindings.prototype.onAdvertisingStart = function(error) {
  this.emit('advertisingStart', error);
};

BlenoBindings.prototype.onAdvertisingStop = function() {
  this.emit('advertisingStop');
};

BlenoBindings.prototype.onLeConnComplete = function(status, handle, role, addressType, address, interval, latency, supervisionTimeout, masterClockAccuracy) {
  // TODO: more than one connection at a time?

  this._address = address;
  this._handle = handle;
  this._aclStream = new AclStream(this._hci, handle, this._hci.addressType, this._hci.address, addressType, address);
  this._gatt.setAclStream(this._aclStream);

  this.emit('accept', address);
};

BlenoBindings.prototype.onLeConnUpdateComplete = function(handle, interval, latency, supervisionTimeout) {
  // no-op
};

BlenoBindings.prototype.onDisconnComplete = function(handle, reason) {
  if (this._aclStream) {
    this._aclStream.push(null, null);
  }

  var address = this._address;

  this._address = null;
  this._handle = null;
  this._aclStream = null;

  if (address) {
    this.emit('disconnect', address); // TODO: use reason
  }

  if (this._advertising) {
    this._gap.restartAdvertising();
  }
};

BlenoBindings.prototype.onEncryptChange = function(handle, encrypt) {
  if (this._aclStream) {
    this._aclStream.pushEncrypt(encrypt);
  }
};

BlenoBindings.prototype.onMtu = function(address, mtu) {
  this.emit('mtuChange', mtu);
};

BlenoBindings.prototype.onRssiRead = function(handle, rssi) {
  this.emit('rssiUpdate', rssi);
};

BlenoBindings.prototype.onAclDataPkt = function(handle, cid, data) {
  if (this._aclStream) {
    this._aclStream.push(cid, data);
  }
};

var blenoBindings = new BlenoBindings();

blenoBindings.init();

module.exports = blenoBindings;
