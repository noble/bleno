var debug = require('debug')('gap');

var events = require('events');
var os = require('os');
var util = require('util');

var Hci = require('./hci');

var isLinux = (os.platform() === 'linux');
var isIntelEdison = isLinux && (os.release().indexOf('edison') !== -1);
var isYocto = isLinux && (os.release().indexOf('yocto') !== -1);

function Gap(hci) {
  this._hci = hci;

  this._advertiseState = null;

  this._hci.on('error', this.onHciError.bind(this));

  this._hci.on('leAdvertisingParametersSet', this.onHciLeAdvertisingParametersSet.bind(this));
  this._hci.on('leAdvertisingDataSet', this.onHciLeAdvertisingDataSet.bind(this));
  this._hci.on('leScanResponseDataSet', this.onHciLeScanResponseDataSet.bind(this));
  this._hci.on('leAdvertiseEnableSet', this.onHciLeAdvertiseEnableSet.bind(this));
}

util.inherits(Gap, events.EventEmitter);

Gap.prototype.startAdvertising = function(name, serviceUuids) {
  debug('startAdvertising: name = ' + name + ', serviceUuids = ' + JSON.stringify(serviceUuids, null, 2));

  var advertisementDataLength = 3;
  var scanDataLength = 0;

  var serviceUuids16bit = [];
  var serviceUuids128bit = [];
  var i = 0;

  if (name && name.length) {
    scanDataLength += 2 + name.length;
  }

  if (serviceUuids && serviceUuids.length) {
    for (i = 0; i < serviceUuids.length; i++) {
      var serviceUuid = new Buffer(serviceUuids[i].match(/.{1,2}/g).reverse().join(''), 'hex');

      if (serviceUuid.length === 2) {
        serviceUuids16bit.push(serviceUuid);
      } else if (serviceUuid.length === 16) {
        serviceUuids128bit.push(serviceUuid);
      }
    }
  }

  if (serviceUuids16bit.length) {
    advertisementDataLength += 2 + 2 * serviceUuids16bit.length;
  }

  if (serviceUuids128bit.length) {
    advertisementDataLength += 2 + 16 * serviceUuids128bit.length;
  }

  var advertisementData = new Buffer(advertisementDataLength);
  var scanData = new Buffer(scanDataLength);

  // flags
  advertisementData.writeUInt8(2, 0);
  advertisementData.writeUInt8(0x01, 1);
  advertisementData.writeUInt8(0x06, 2);

  var advertisementDataOffset = 3;

  if (serviceUuids16bit.length) {
    advertisementData.writeUInt8(1 + 2 * serviceUuids16bit.length, advertisementDataOffset);
    advertisementDataOffset++;

    advertisementData.writeUInt8(0x03, advertisementDataOffset);
    advertisementDataOffset++;

    for (i = 0; i < serviceUuids16bit.length; i++) {
      serviceUuids16bit[i].copy(advertisementData, advertisementDataOffset);
      advertisementDataOffset += serviceUuids16bit[i].length;
    }
  }

  if (serviceUuids128bit.length) {
    advertisementData.writeUInt8(1 + 16 * serviceUuids128bit.length, advertisementDataOffset);
    advertisementDataOffset++;

    advertisementData.writeUInt8(0x06, advertisementDataOffset);
    advertisementDataOffset++;

    for (i = 0; i < serviceUuids128bit.length; i++) {
      serviceUuids128bit[i].copy(advertisementData, advertisementDataOffset);
      advertisementDataOffset += serviceUuids128bit[i].length;
    }
  }

  // name
  if (name && name.length) {
    var nameBuffer = new Buffer(name);

    scanData.writeUInt8(1 + nameBuffer.length, 0);
    scanData.writeUInt8(0x08, 1);
    nameBuffer.copy(scanData, 2);
  }

  this.startAdvertisingWithEIRData(advertisementData, scanData);
};


Gap.prototype.startAdvertisingIBeacon = function(data) {
  debug('startAdvertisingIBeacon: data = ' + data.toString('hex'));

  var dataLength = data.length;
  var manufacturerDataLength = 4 + dataLength;
  var advertisementDataLength = 5 + manufacturerDataLength;
  var scanDataLength = 0;

  var advertisementData = new Buffer(advertisementDataLength);
  var scanData = new Buffer(0);

  // flags
  advertisementData.writeUInt8(2, 0);
  advertisementData.writeUInt8(0x01, 1);
  advertisementData.writeUInt8(0x06, 2);

  advertisementData.writeUInt8(manufacturerDataLength + 1, 3);
  advertisementData.writeUInt8(0xff, 4);
  advertisementData.writeUInt16LE(0x004c, 5); // Apple Company Identifier LE (16 bit)
  advertisementData.writeUInt8(0x02, 7); // type, 2 => iBeacon
  advertisementData.writeUInt8(dataLength, 8);

  data.copy(advertisementData, 9);

  this.startAdvertisingWithEIRData(advertisementData, scanData);
};

Gap.prototype.startAdvertisingWithEIRData = function(advertisementData, scanData) {
  advertisementData = advertisementData || new Buffer(0);
  scanData = scanData || new Buffer(0);

  debug('startAdvertisingWithEIRData: advertisement data = ' + advertisementData.toString('hex') + ', scan data = ' + scanData.toString('hex'));

  var error = null;

  if (advertisementData.length > 31) {
    error = new Error('Advertisement data is over maximum limit of 31 bytes');
  } else if (scanData.length > 31) {
    error = new Error('Scan data is over maximum limit of 31 bytes');
  }

  if (error) {
    this.emit('advertisingStart', error);
  } else {
    this._advertiseState = 'starting';

    if (isIntelEdison || isYocto) {
      // work around for Intel Edison
      debug('skipping first set of scan response and advertisement data');
    } else {
      this._hci.setScanResponseData(scanData);
      this._hci.setAdvertisingData(advertisementData);
    }
    this._hci.setAdvertiseEnable(true);
    this._hci.setScanResponseData(scanData);
    this._hci.setAdvertisingData(advertisementData);
  }
};

Gap.prototype.restartAdvertising = function() {
  this._advertiseState = 'restarting';

  this._hci.setAdvertiseEnable(true);
};

Gap.prototype.stopAdvertising = function() {
  this._advertiseState = 'stopping';

  this._hci.setAdvertiseEnable(false);
};

Gap.prototype.onHciError = function(error) {
};

Gap.prototype.onHciLeAdvertisingParametersSet = function(status) {
};

Gap.prototype.onHciLeAdvertisingDataSet = function(status) {
};

Gap.prototype.onHciLeScanResponseDataSet = function(status) {
};

Gap.prototype.onHciLeAdvertiseEnableSet = function(status) {
  if (this._advertiseState === 'starting') {
    this._advertiseState = 'started';

    var error = null;

    if (status) {
      error = new Error(Hci.STATUS_MAPPER[status] || ('Unknown (' + status + ')'));
    }

    this.emit('advertisingStart', error);
  } else if (this._advertiseState === 'stopping') {
    this._advertiseState = 'stopped';

    this.emit('advertisingStop');
  }
};

module.exports = Gap;
