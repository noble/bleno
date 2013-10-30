/*jshint loopfunc: true */

var debug = require('debug')('l2cap-ble');

var events = require('events');
var spawn = require('child_process').spawn;
var util = require('util');

var ATT_OP_ERROR                = 0x01;
var ATT_OP_MTU_REQ              = 0x02;
var ATT_OP_MTU_RESP             = 0x03;
var ATT_OP_FIND_INFO_REQ        = 0x04;
var ATT_OP_FIND_INFO_RESP       = 0x05;
var ATT_OP_READ_BY_TYPE_REQ     = 0x08;
var ATT_OP_READ_BY_TYPE_RESP    = 0x09;
var ATT_OP_READ_REQ             = 0x0a;
var ATT_OP_READ_RESP            = 0x0b;
var ATT_OP_READ_BY_GROUP_REQ    = 0x10;
var ATT_OP_READ_BY_GROUP_RESP   = 0x11;
var ATT_OP_WRITE_REQ            = 0x12;
var ATT_OP_WRITE_RESP           = 0x13;
var ATT_OP_HANDLE_NOTIFY        = 0x1b;
var ATT_OP_WRITE_CMD            = 0x52;

var GATT_PRIM_SVC_UUID          = 0x2800;
var GATT_INCLUDE_UUID           = 0x2802;
var GATT_CHARAC_UUID            = 0x2803;

var GATT_CLIENT_CHARAC_CFG_UUID = 0x2902;
var GATT_SERVER_CHARAC_CFG_UUID = 0x2903;

var L2capBle = function(address, addressType) {
  var l2capBle = __dirname + '/../../build/Release/l2cap-ble';
  
  debug('l2capBle = ' + l2capBle);

  this._l2capBle = spawn('stdbuf', ['-o', '0', '-e', '0', '-i', '0', l2capBle]);
  this._l2capBle.on('close', this.onClose.bind(this));
  this._l2capBle.stdout.on('data', this.onStdoutData.bind(this));
  this._l2capBle.stderr.on('data', this.onStderrData.bind(this));

  this._buffer = "";
};

util.inherits(L2capBle, events.EventEmitter);

L2capBle.prototype.kill = function() {
  this._l2capBle.kill();
};

L2capBle.prototype.onClose = function(code) {
  debug('close = ' + code);
};

L2capBle.prototype.onStdoutData = function(data) {
  this._buffer += data.toString();

  debug('buffer = ' + JSON.stringify(this._buffer));

  var newLineIndex;
  while ((newLineIndex = this._buffer.indexOf('\n')) !== -1) {
    var line = this._buffer.substring(0, newLineIndex);
    var found;
    
    this._buffer = this._buffer.substring(newLineIndex + 1);

    debug('line = ' + line);

    if ((found = line.match(/^accept (.*)$/))) {
      var clientAddress = found[1];

      this.emit('accept', clientAddress);
    } else if ((found = line.match(/^disconnect (.*)$/))) {
      var clientAddress = found[1];

      this.emit('disconnect', clientAddress);
    }
  }
};

L2capBle.prototype.onStderrData = function(data) {
  console.error('stderr: ' + data);
};

module.exports = L2capBle;
