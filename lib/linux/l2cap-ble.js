/*jshint loopfunc: true */

var debug = require('debug')('l2cap-ble');

var events = require('events');
var os = require('os');
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

var ATT_ECODE_INVALID_HANDLE    = 0x01;
var ATT_ECODE_ATTR_NOT_FOUND    = 0x0A;
var ATT_ECODE_UNSUPP_GRP_TYPE   = 0x10;

var L2capBle = function(address, addressType) {
  var l2capBle = __dirname + '/../../build/Release/l2cap-ble';
  
  debug('l2capBle = ' + l2capBle);

  this._l2capBle = spawn('stdbuf', ['-o', '0', '-e', '0', '-i', '0', l2capBle]);
  this._l2capBle.on('close', this.onClose.bind(this));
  this._l2capBle.stdout.on('data', this.onStdoutData.bind(this));
  this._l2capBle.stderr.on('data', this.onStderrData.bind(this));

  this._buffer = "";

  this._mtu = 23;

  this._handles = [];
  this._handles[1] = {
    type: 'service',
    uuid: 0x1800,
    startHandle: 1,
    endHandle: 5
  };
  this._handles[2] = {
    type: 'characteristic',
    uuid: 0x2a00,
    properties: 0x02,
    startHandle: 2,
    valueHandle: 3
  };
  this._handles[3] = {
    type: 'characteristicValue',
    value: new Buffer(os.hostname())
  };
  this._handles[4] = {
    type: 'characteristic',
    uuid: 0x2a01,
    properties: 0x02,
    startHandle: 4,
    valueHandle: 5
  };
  this._handles[5] = {
    type: 'characteristicValue',
    value: new Buffer([0x80, 0x00])
  };
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
    } else if ((found = line.match(/^data (.*)$/))) {
      var lineData = new Buffer(found[1], 'hex');

      this.onRequest(lineData);
    }
  }
};

L2capBle.prototype.onStderrData = function(data) {
  console.error('stderr: ' + data);
};

L2capBle.prototype.mtuResponse = function(mtu) {
  var buf = new Buffer(3);

  buf.writeUInt8(ATT_OP_MTU_RESP, 0);
  buf.writeUInt16LE(mtu, 1);

  return buf;
};

L2capBle.prototype.errorResponse = function(opcode, handle, status) {
  var buf = new Buffer(5);

  buf.writeUInt8(ATT_OP_ERROR, 0);
  buf.writeUInt8(opcode, 1);
  buf.writeUInt16LE(handle, 2);
  buf.writeUInt8(status, 4);

  return buf;
};

L2capBle.prototype.onRequest = function(request) {
  debug('handing request: ' + request.toString('hex'));

  var requestType = request[0];
  var response = null;

  if (ATT_OP_MTU_REQ === requestType) {
    var mtu = request.readUInt16LE(1);

    this._mtu = mtu;

    response = this.mtuResponse(mtu);
  } else if (ATT_OP_READ_BY_GROUP_REQ === requestType) {
    var startHandle = request.readUInt16LE(1);
    var endHandle = request.readUInt16LE(3);
    var uuid = request.readUInt16LE(5);

    debug('read by group: startHandle = 0x' + startHandle.toString(16) + ', endHandle = 0x' + endHandle.toString(16) + ', uuid = 0x' + uuid.toString(16));
  
    if (GATT_PRIM_SVC_UUID === uuid) {
      var services = [];

      for (var i = startHandle; i < endHandle; i++) {
        var handle = this._handles[i];

        if (!handle) {
          break;
        }

        if (handle.type === 'service') {
          services.push(handle);
        }
      }

      if (services.length) {
        // TODO: MTU, UUID sizes
        response = new Buffer(2 + services.length * 6);

        response[0] = ATT_OP_READ_BY_GROUP_RESP;
        response[1] = 0x06;

        for (var i = 0; i < services.length; i++) {
          var service = services[i];

          response.writeUInt16LE(service.startHandle, 2 + i * 6);
          response.writeUInt16LE(service.endHandle, 2 + i * 6 + 2);
          response.writeUInt16LE(service.uuid, 2 + i * 6 + 4);
        }
      } else {
        response = this.errorResponse(ATT_OP_READ_BY_GROUP_REQ, startHandle, ATT_ECODE_ATTR_NOT_FOUND);
      }
    }
  } else if (ATT_OP_READ_BY_TYPE_REQ === requestType) {
    var startHandle = request.readUInt16LE(1);
    var endHandle = request.readUInt16LE(3);
    var uuid = request.readUInt16LE(5);

    debug('read by type: startHandle = 0x' + startHandle.toString(16) + ', endHandle = 0x' + endHandle.toString(16) + ', uuid = 0x' + uuid.toString(16));

    if (GATT_CHARAC_UUID === uuid) {
      var characteristics = [];

      for (var i = startHandle; i < endHandle; i++) {
        var handle = this._handles[i];

        if (!handle) {
          break;
        }

        if (handle.type === 'characteristic') {
          characteristics.push(handle);
        }
      }

      if (characteristics.length) {
        // TODO: MTU, UUID sizes
        response = new Buffer(2 + characteristics.length * 7);

        response[0] = ATT_OP_READ_BY_TYPE_RESP;
        response[1] = 0x07;

        for (var i = 0; i < characteristics.length; i++) {
          var characteristic = characteristics[i];

          response.writeUInt16LE(characteristic.startHandle, 2 + i * 7);
          response.writeUInt8(characteristic.properties, 2 + i * 7 + 2);
          response.writeUInt16LE(characteristic.valueHandle, 2 + i * 7 + 3);
          response.writeUInt16LE(characteristic.uuid, 2 + i * 7 + 5);
        }
      } else {
        response = this.errorResponse(ATT_OP_READ_BY_TYPE_REQ, startHandle, ATT_ECODE_ATTR_NOT_FOUND);
      }
    } else {
      var valueHandle = null;

      for (var i = startHandle; i < endHandle; i++) {
        var handle = this._handles[i];

        if (!handle) {
          break;
        }

        if (handle.type === 'characteristic' && handle.uuid === uuid) {
          valueHandle = handle.valueHandle;
          break;
        }
      }

      if (valueHandle) {
        var data = this._handles[valueHandle].value;

        // TODO: MTU
        response = new Buffer(4 + data.length);

        response[0] = ATT_OP_READ_BY_TYPE_RESP;
        response[1] = 0x01;
        response.writeUInt16LE(valueHandle, 2);

        for (var i = 0; i < data.length; i++) {
          response[i + 4] = data[i];
        }
      } else {
        response = this.errorResponse(ATT_OP_READ_BY_TYPE_REQ, startHandle, ATT_ECODE_ATTR_NOT_FOUND);
      }
    }
  } else if (ATT_OP_READ_REQ === requestType) {
    var valueHandle = request.readUInt16LE(1);
    var handle = this._handles[valueHandle];

    if (handle && handle.type === 'characteristicValue') {
      var data = this._handles[valueHandle].value;

      // TODO: MTU
      response = new Buffer(1 + data.length);

      response[0] = ATT_OP_READ_RESP;
      for (var i = 0; i < data.length; i++) {
        response[1 + i] = data[i];
      }
    } else {
      response = this.errorResponse(ATT_OP_READ_REQ, valueHandle, ATT_ECODE_INVALID_HANDLE);
    }
  }

  if (response) {
    debug('response: ' + response.toString('hex'));

    this._l2capBle.stdin.write(response.toString('hex') + '\n');
  }
};

module.exports = L2capBle;
