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

  if (name && name.length) {
    eirDataLength += 2 + name.length;
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

  // TODO: use service UUIDS
  debug('startAdvertising: eirData = ' + eirData.toString('hex'));

  this._hciBle.stdin.write(eirData.toString('hex') + '\n');

  this.emit('advertisingStart');
};

HciBle.prototype.stopAdvertising = function() {
  this._hciBle.kill('SIGHUP');

  this.emit('advertisingStop');
};

module.exports = HciBle;

