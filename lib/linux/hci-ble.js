var debug = require('debug')('hci-ble');

var events = require('events');
var spawn = require('child_process').spawn;
var util = require('util');

var HciBle = function() {
  var hciBle = __dirname + '/../../build/Release/hci-ble';
  
  debug('hciBle = ' + hciBle);

  this._hciBle = spawn(hciBle);
  this._hciBle.on('close', this.onClose.bind(this));

  this._hciBle.stdout.on('data', this.onStdoutData.bind(this));
  this._hciBle.stderr.on('data', this.onStderrData.bind(this));

  this._hciBle.on('error', function() { });

  this._buffer = "";
};

util.inherits(HciBle, events.EventEmitter);

HciBle.prototype.onClose = function(code) {
  debug('close = ' + code);
};

HciBle.prototype.onStdoutData = function(data) {
  this._buffer += data.toString();

  debug('buffer = ' + JSON.stringify(this._buffer));

  var newLineIndex;
  while ((newLineIndex = this._buffer.indexOf('\n')) !== -1) {
    var line = this._buffer.substring(0, newLineIndex);
    var found;
    
    this._buffer = this._buffer.substring(newLineIndex + 1);

    debug('line = ' + line);

    if ((found = line.match(/^adapterState (.*)$/))) {
      var adapterState = found[1];

      debug('adapterState = ' + adapterState);

      if (adapterState === 'unauthorized') {
        console.log('bleno warning: adapter state unauthorized, please run as root or with sudo');
      }
      
      this.emit('stateChange', adapterState);
    }
  }
};

HciBle.prototype.onStderrData = function(data) {
  console.error('stderr: ' + data);
};

HciBle.prototype.startAdvertising = function(name, serviceUuids) {
  debug('startAdvertising: name = ' + name + ', serviceUuids = ' + JSON.stringify(serviceUuids, null, 2));
  
  var advertisementDataLength = 3;
  var scanDataLength = 0;

  var serviceUuids16bit = [];
  var serviceUuids128bit = [];
  var i = 0;
  var j = 0;
  var k = 0;

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

  i = 0;
  var advertisementData = new Buffer(advertisementDataLength);

  // flags
  advertisementData[i++] = 2;
  advertisementData[i++] = 0x01;
  advertisementData[i++] = 0x05;

  if (serviceUuids16bit.length) {
    advertisementData[i++] = 1 + 2 * serviceUuids16bit.length;
    advertisementData[i++] = 0x03;
    for (j = 0; j < serviceUuids16bit.length; j++) {
      for (k = 0; k < serviceUuids16bit[j].length; k++) {
        advertisementData[i++] = serviceUuids16bit[j][k];
      }
    }
  }

  if (serviceUuids128bit.length) {
    advertisementData[i++] = 1 + 16 * serviceUuids128bit.length;
    advertisementData[i++] = 0x06;
    for (j = 0; j < serviceUuids128bit.length; j++) {
      for (k = 0; k < serviceUuids128bit[j].length; k++) {
        advertisementData[i++] = serviceUuids128bit[j][k];
      }
    }
  }

  i = 0;
  var scanData = new Buffer(scanDataLength);

  // name
  if (name && name.length) {
    var nameBuffer = new Buffer(name);

    scanData[i++] = nameBuffer.length + 1;
    scanData[i++] = 0x08;
    for (j = 0; j < nameBuffer.length; j++) {
      scanData[i++] = nameBuffer[j];
    }
  }

  this.startAdvertisingWithEIRData(advertisementData, scanData);
};


HciBle.prototype.startAdvertisingIBeacon = function(data) {
  debug('startAdvertisingIBeacon: data = ' + data.toString('hex'));
  
  var dataLength = data.length;
  var manufacturerDataLength = 6 + dataLength;
  var advertisementDataLength = 3 + manufacturerDataLength;
  var scanDataLength = 0;

  i = 0;
  var advertisementData = new Buffer(advertisementDataLength);

  // flags
  advertisementData[i++] = 2;
  advertisementData[i++] = 0x01;
  advertisementData[i++] = 0x05;

  // manufacturer data
  advertisementData[i++] = manufacturerDataLength - 1;
  advertisementData[i++] = 0xff;
  advertisementData[i++] = 0x4c; // Apple Company Identifier LE (16 bit)
  advertisementData[i++] = 0x00;
  advertisementData[i++] = 0x02; // type, 2 => iBeacon
  advertisementData[i++] = dataLength;

  for (var j = 0; j < dataLength; j++) {
    advertisementData[i++] = data[j];
  }

  i = 0;
  var scanData = new Buffer(scanDataLength);

  this.startAdvertisingWithEIRData(advertisementData, scanData);
};

HciBle.prototype.startAdvertisingWithEIRData = function(advertisementData, scanData) {
  debug('startAdvertisingWithEIRData: advertisement data = ' + advertisementData.toString('hex') + ', scan data = ' + scanData.toString('hex'));

  var error = null;

  if (advertisementData.length > 31) {
    error = new Error('Advertisement data is over maximum limit of 31 bytes');
  } else if (scanData.length > 31) {
    error = new Error('Scan data is over maximum limit of 31 bytes');
  } else {
    this._hciBle.stdin.write(advertisementData.toString('hex') + ' ' + scanData.toString('hex') + '\n');
  }

  this.emit('advertisingStart', error);
};

HciBle.prototype.restartAdvertising = function(name, serviceUuids) {
  this._hciBle.kill('SIGUSR1');
};

HciBle.prototype.stopAdvertising = function() {
  this._hciBle.kill('SIGHUP');

  this.emit('advertisingStop');
};

module.exports = HciBle;
