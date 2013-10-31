var debug = require('debug')('hci-ble');

var events = require('events');
var spawn = require('child_process').spawn;
var util = require('util');

var HciBle = function() {
  var hciBle = __dirname + '/../../build/Release/hci-ble';
  
  debug('hciBle = ' + hciBle);

  this._hciBle = spawn('stdbuf', ['-o', '0', '-e', '0', '-i', '0', hciBle]);
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
  debug('startAdvertising: name = ' + name);
  var eirDataLength = 3;
  var serviceUuids16bit = [];
  var serviceUuids128bit = [];

  if (name && name.length) {
    eirDataLength += 2 + name.length;
  }

  if (serviceUuids && serviceUuids.length) {
    for (var i = 0; i < serviceUuids.length; i++) {
      var serviceUuid = new Buffer(serviceUuids[i].match(/.{1,2}/g).reverse().join(''), 'hex');

      if (serviceUuid.length === 2) {
        serviceUuids16bit.push(serviceUuid);
      } else if (serviceUuid.length === 16) {
        serviceUuids128bit.push(serviceUuid);
      }
    }
  }

  if (serviceUuids16bit.length) {
    eirDataLength += 2 + 2 * serviceUuids16bit.length;
  }

  if (serviceUuids128bit.length) {
    eirDataLength += 2 + 16 * serviceUuids128bit.length;
  }

  var i = 0;
  var eirData = new Buffer(eirDataLength);

  // flags
  eirData[i++] = 2;
  eirData[i++] = 0x01;
  eirData[i++] = 0x02;

  // name
  if (name && name.length) {
    var nameBuffer = new Buffer(name);

    eirData[i++] = nameBuffer.length + 1;
    eirData[i++] = 0x08;
    for (var j = 0; j < nameBuffer.length; j++) {
      eirData[i++] = nameBuffer[j];
    }
  }

  if (serviceUuids16bit.length) {
    eirData[i++] = 1 + 2 * serviceUuids16bit.length;
    eirData[i++] = 0x02;
    for (var j = 0; j < serviceUuids16bit.length; j++) {
      for (var k = 0; k < serviceUuids16bit[j].length; k++) {
        eirData[i++] = serviceUuids16bit[j][k];
      }
    }
  }

  if (serviceUuids128bit.length) {
    eirData[i++] = 1 + 16 * serviceUuids128bit.length;
    eirData[i++] = 0x06;
    for (var j = 0; j < serviceUuids128bit.length; j++) {
      for (var k = 0; k < serviceUuids128bit[j].length; k++) {
        eirData[i++] = serviceUuids128bit[j][k];
      }
    }
  }

  // TODO: maximum EIR data length (31 bytes)

  debug('startAdvertising: eirData = ' + eirData.toString('hex'));

  this._hciBle.stdin.write(eirData.toString('hex') + '\n');

  this.emit('advertisingStart');
};

HciBle.prototype.restartAdvertising = function(name, serviceUuids) {
  this._hciBle.kill('SIGUSR1');
};

HciBle.prototype.stopAdvertising = function() {
  this._hciBle.kill('SIGHUP');

  this.emit('advertisingStop');
};

module.exports = HciBle;

