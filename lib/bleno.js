var debug = require('debug')('bleno');

var events = require('events');
var os = require('os');
var util = require('util');

var UuidUtil = require('./uuid-util');

var PrimaryService = require('./primary-service');
var Characteristic = require('./characteristic');
var Descriptor = require('./descriptor');

var bindings = null;

var platform = os.platform();

if (platform === 'darwin') {
  bindings = require('./mac/bindings');
} else if (platform === 'linux' || platform === 'freebsd' || platform === 'win32' || platform === 'android') {
  bindings = require('./hci-socket/bindings');
} else {
  throw new Error('Unsupported platform');
}

function Bleno() {
  this.initialized = false;
  this.platform = 'unknown';
  this.state = 'unknown';
  this.address = 'unknown';
  this.rssi = 0;
  this.mtu = 20;

  this._bindings = bindings;

  this._bindings.on('stateChange', this.onStateChange.bind(this));
  this._bindings.on('platform', this.onPlatform.bind(this));
  this._bindings.on('addressChange', this.onAddressChange.bind(this));
  this._bindings.on('advertisingStart', this.onAdvertisingStart.bind(this));
  this._bindings.on('advertisingStop', this.onAdvertisingStop.bind(this));
  this._bindings.on('servicesSet', this.onServicesSet.bind(this));
  this._bindings.on('accept', this.onAccept.bind(this));
  this._bindings.on('mtuChange', this.onMtuChange.bind(this));
  this._bindings.on('disconnect', this.onDisconnect.bind(this));

  this._bindings.on('rssiUpdate', this.onRssiUpdate.bind(this));

  this.on('newListener', function(event) {
    if (event === 'stateChange' && !this.initialized) {
      this._bindings.init();

      this.initialized = true;
    }
  }.bind(this));
}

util.inherits(Bleno, events.EventEmitter);

Bleno.prototype.PrimaryService = PrimaryService;
Bleno.prototype.Characteristic = Characteristic;
Bleno.prototype.Descriptor = Descriptor;

Bleno.prototype.onPlatform = function(platform) {
  debug('platform ' + platform);

  this.platform = platform;
};

Bleno.prototype.onStateChange = function(state) {
  debug('stateChange ' + state);

  this.state = state;

  this.emit('stateChange', state);
};

Bleno.prototype.onAddressChange = function(address) {
  debug('addressChange ' + address);

  this.address = address;
};

Bleno.prototype.onAccept = function(clientAddress) {
  debug('accept ' + clientAddress);
  this.emit('accept', clientAddress);
};

Bleno.prototype.onMtuChange = function(mtu) {
  debug('mtu ' + mtu);

  this.mtu = mtu;

  this.emit('mtuChange', mtu);
};

Bleno.prototype.onDisconnect = function(clientAddress) {
  debug('disconnect ' + clientAddress);
  this.emit('disconnect', clientAddress);
};

Bleno.prototype.startAdvertising = function(name, serviceUuids, callback) {
  if (this.state !== 'poweredOn') {
    var error = new Error('Could not start advertising, state is ' + this.state + ' (not poweredOn)');

    if (typeof callback === 'function') {
      callback(error);
    } else {
      throw error;
    }
  } else {
    if (callback) {
      this.once('advertisingStart', callback);
    }

    var undashedServiceUuids = [];

    if (serviceUuids && serviceUuids.length) {
      for (var i = 0; i < serviceUuids.length; i++) {
        undashedServiceUuids[i] = UuidUtil.removeDashes(serviceUuids[i]);
      }
    }

    this._bindings.startAdvertising(name, undashedServiceUuids);
  }
};

Bleno.prototype.startAdvertisingIBeacon = function(uuid, major, minor, measuredPower, callback) {
  if (this.state !== 'poweredOn') {
    var error = new Error('Could not start advertising, state is ' + this.state + ' (not poweredOn)');

    if (typeof callback === 'function') {
      callback(error);
    } else {
      throw error;
    }
  } else {
    var undashedUuid =  UuidUtil.removeDashes(uuid);
    var uuidData = new Buffer(undashedUuid, 'hex');
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
  }
};

Bleno.prototype.onAdvertisingStart = function(error) {
  debug('advertisingStart: ' + error);

  if (error) {
    this.emit('advertisingStartError', error);
  }

  this.emit('advertisingStart', error);
};

Bleno.prototype.startAdvertisingWithEIRData = function(advertisementData, scanData, callback) {
  if (typeof scanData === 'function') {
    callback = scanData;
    scanData = null;
  }

  if (this.state !== 'poweredOn') {
    var error = new Error('Could not advertising scanning, state is ' + this.state + ' (not poweredOn)');

    if (typeof callback === 'function') {
      callback(error);
    } else {
      throw error;
    }
  } else {
    if (callback) {
      this.once('advertisingStart', callback);
    }

    this._bindings.startAdvertisingWithEIRData(advertisementData, scanData);
  }
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

Bleno.prototype.onServicesSet = function(error) {
  debug('servicesSet');

  if (error) {
    this.emit('servicesSetError', error);
  }

  this.emit('servicesSet', error);
};

Bleno.prototype.disconnect = function() {
  debug('disconnect');
  this._bindings.disconnect();
};

Bleno.prototype.updateRssi = function(callback) {
  if (callback) {
    this.once('rssiUpdate', function(rssi) {
      callback(null, rssi);
    });
  }

  this._bindings.updateRssi();
};

Bleno.prototype.onRssiUpdate = function(rssi) {
  this.emit('rssiUpdate', rssi);
};

module.exports = Bleno;
