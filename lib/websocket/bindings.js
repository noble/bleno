var events = require('events');
var util = require('util');

var debug = require('debug')('bindings');
var WebSocket = require('ws');

var BlenoBindings = function() {
  var port = 0xB1f;
  this._ws = new WebSocket('ws://localhost:' + port);

  this._deviceUUID = null;

  this.on('message', this._onMessage.bind(this));

  if (!this._ws.on) {
    this._ws.on = this._ws.addEventListener;
  }

  this._ws.on('open', this._onOpen.bind(this));
  this._ws.on('close', this._onClose.bind(this));
  this._ws.on('error', this._onError.bind(this));

  var _this = this;
  this._ws.on('message', function(event) {
    var data = (process.title === 'browser') ? event.data : event;

    _this.emit('message', JSON.parse(data));
  });
};

util.inherits(BlenoBindings, events.EventEmitter);

BlenoBindings.prototype._onOpen = function() {
};

BlenoBindings.prototype._onClose = function() {
  this.emit('stateChange', 'poweredOff');
};

BlenoBindings.prototype._onError = function(error) {
  this.emit('error', error);
};

BlenoBindings.prototype._onMessage = function(event) {
  var type = event.type;
  var state = event.state;
  var error = event.error;
  var clientAddress = event.clientAddress;
  var rssi = event.rssi;
  var address = event.address;

  debug('on -> message: ' + JSON.stringify(event, undefined, 2));

  if (type === 'stateChange') {
    debug('state change ' + state);
    this.emit('stateChange', state);
  } else if (type === 'advertisingStart') {
    this.emit('advertisingStart', error);
  } else if (type === 'advertisingStartError') {
    this.emit('advertisingStartError', error);
  } else if (type === 'advertisingStop') {
    this.emit('advertisingStop');
  } else if (type === 'servicesSet') {
    this.emit('servicesSet', error);
  } else if (type === 'servicesSetError') {
    this.emit('servicesSetError', error);
  } else if (type === 'accept') {
    this._deviceUUID = clientAddress;
    this.emit('accept', clientAddress);
  } else if (type === 'disconnect') {
    this.emit('disconnect', clientAddress);
  } else if (type === 'rssiUpdate') {
    this.emit('rssiUpdate', rssi);
  } else if (type === 'addressChange') {
    this.emit('addressChange', address);
  }
};

BlenoBindings.prototype._sendCommand = function(command) {
  debug('on -> sendMessage: ' + JSON.stringify(command, undefined, 2));
  var message = JSON.stringify(command);
  this._ws.send(message);
};

BlenoBindings.prototype.disconnect = function() {
  this._sendCommand({
    action: 'disconnect'
  });
};

var blenoBindings = new BlenoBindings();

blenoBindings.startAdvertising = function(name, serviceUuids) {
  this._sendCommand({
    action: 'startAdvertising',
    name: name,
    serviceUuids: serviceUuids
  });
};

blenoBindings.startAdvertisingIBeacon = function(data) {
  this._sendCommand({
    action: 'startAdvertisingIBeacon',
    data: data.toString('hex'),
  });
};

blenoBindings.startAdvertisingWithEIRData = function(advertisementData, scanData) {
  if(!scanData){
    scanData = new Buffer([]);
  }

  this._sendCommand({
    action: 'startAdvertisingWithEIRData',
    advertisementData: advertisementData.toString('hex'),
    scanData: scanData.toString('hex')
  });
};

blenoBindings.stopAdvertising = function() {
  this._sendCommand({
    action: 'stopAdvertising'
  });
};

blenoBindings.setServices = function(services) {
  // todo serialize services more fully
  this._sendCommand({
    action: 'setServices',
    services: services
  });
};


blenoBindings.updateRssi = function() {
  if (this._deviceUUID === null) {
    this.emit('rssiUpdate', 127); // not supported
  } else {
    this._sendCommand({
      action: 'updateRssi',
      deviceUUID: this._deviceUUID
    });
  }
};

module.exports = blenoBindings;
