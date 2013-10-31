/*jshint loopfunc: true */

var debug = require('debug')('l2cap-ble');

var events = require('events');
var os = require('os');
var spawn = require('child_process').spawn;
var util = require('util');

var ATT_OP_ERROR                    = 0x01;
var ATT_OP_MTU_REQ                  = 0x02;
var ATT_OP_MTU_RESP                 = 0x03;
var ATT_OP_FIND_INFO_REQ            = 0x04;
var ATT_OP_FIND_INFO_RESP           = 0x05;
var ATT_OP_FIND_BY_TYPE_REQ         = 0x06;
var ATT_OP_FIND_BY_TYPE_RESP        = 0x07;
var ATT_OP_READ_BY_TYPE_REQ         = 0x08;
var ATT_OP_READ_BY_TYPE_RESP        = 0x09;
var ATT_OP_READ_REQ                 = 0x0a;
var ATT_OP_READ_RESP                = 0x0b;
var ATT_OP_READ_BLOB_REQ            = 0x0c;
var ATT_OP_READ_BLOB_RESP           = 0x0d;
var ATT_OP_READ_MULTI_REQ           = 0x0e;
var ATT_OP_READ_MULTI_RESP          = 0x0f;
var ATT_OP_READ_BY_GROUP_REQ        = 0x10;
var ATT_OP_READ_BY_GROUP_RESP       = 0x11;
var ATT_OP_WRITE_REQ                = 0x12;
var ATT_OP_WRITE_RESP               = 0x13;
var ATT_OP_WRITE_CMD                = 0x52;
var ATT_OP_PREP_WRITE_REQ           = 0x16;
var ATT_OP_PREP_WRITE_RESP          = 0x17;
var ATT_OP_EXEC_WRITE_REQ           = 0x18;
var ATT_OP_EXEC_WRITE_RESP          = 0x19;
var ATT_OP_HANDLE_NOTIFY            = 0x1b;
var ATT_OP_HANDLE_IND               = 0x1d;
var ATT_OP_HANDLE_CNF               = 0x1e;
var ATT_OP_SIGNED_WRITE_CMD         = 0xd2;

var GATT_PRIM_SVC_UUID              = 0x2800;
var GATT_INCLUDE_UUID               = 0x2802;
var GATT_CHARAC_UUID                = 0x2803;

var GATT_CLIENT_CHARAC_CFG_UUID     = 0x2902;
var GATT_SERVER_CHARAC_CFG_UUID     = 0x2903;

var ATT_ECODE_INVALID_HANDLE        = 0x01;
var ATT_ECODE_READ_NOT_PERM         = 0x02;
var ATT_ECODE_WRITE_NOT_PERM        = 0x03;
var ATT_ECODE_INVALID_PDU           = 0x04;
var ATT_ECODE_AUTHENTICATION        = 0x05;
var ATT_ECODE_REQ_NOT_SUPP          = 0x06;
var ATT_ECODE_INVALID_OFFSET        = 0x07;
var ATT_ECODE_AUTHORIZATION         = 0x08;
var ATT_ECODE_PREP_QUEUE_FULL       = 0x09;
var ATT_ECODE_ATTR_NOT_FOUND        = 0x0a;
var ATT_ECODE_ATTR_NOT_LONG         = 0x0b;
var ATT_ECODE_INSUFF_ENCR_KEY_SIZE  = 0x0c;
var ATT_ECODE_INVAL_ATTR_VALUE_LEN  = 0x0d;
var ATT_ECODE_UNLIKELY              = 0x0e;
var ATT_ECODE_INSUFF_ENC            = 0x0f;
var ATT_ECODE_UNSUPP_GRP_TYPE       = 0x10;
var ATT_ECODE_INSUFF_RESOURCES      = 0x11;

var L2capBle = function(address, addressType) {
  var l2capBle = __dirname + '/../../build/Release/l2cap-ble';
  
  debug('l2capBle = ' + l2capBle);

  this._l2capBle = spawn('stdbuf', ['-o', '0', '-e', '0', '-i', '0', l2capBle]);
  this._l2capBle.on('close', this.onClose.bind(this));
  this._l2capBle.stdout.on('data', this.onStdoutData.bind(this));
  this._l2capBle.stderr.on('data', this.onStderrData.bind(this));

  this._buffer = "";

  this._mtu = 23;

  this.setServices([]);
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
    var clientAddress;
    
    this._buffer = this._buffer.substring(newLineIndex + 1);

    debug('line = ' + line);

    if ((found = line.match(/^accept (.*)$/))) {
      clientAddress = found[1];

      this._mtu = 23; // reset MTU

      this.emit('accept', clientAddress);
    } else if ((found = line.match(/^disconnect (.*)$/))) {
      clientAddress = found[1];

      this.emit('disconnect', clientAddress);
    } else if ((found = line.match(/^data (.*)$/))) {
      var lineData = new Buffer(found[1], 'hex');

      this.handleRequest(lineData);
    }
  }
};

L2capBle.prototype.onStderrData = function(data) {
  console.error('stderr: ' + data);
};

L2capBle.prototype.setServices = function(services) {
  // base services and characteristics
  var allServices = [
    {
      uuid: '1800',
      characteristics: [
        {
          uuid: '2a00',
          properties: ['read'],
          value: new Buffer(os.hostname())
        },
        {
          uuid: '2a01',
          properties: ['read'],
          value: new Buffer([0x80, 0x00])
        }
      ]
    }
  ].concat(services);

  this._handles = [];

  var handle = 0;
  var i;
  var j;

  for (i = 0; i < allServices.length; i++) {
    var service = allServices[i];

    handle++;
    var serviceHandle = handle;

    this._handles[serviceHandle] = {
      type: 'service',
      uuid: service.uuid,
      startHandle: serviceHandle
      // endHandle filled in below
    };

    for (j = 0; j < service.characteristics.length; j++) {
      var characteristic = service.characteristics[j];

      var properties = 0;

      if (characteristic.properties.indexOf('read') !== -1) {
        properties |= 0x02;
      }

      if (characteristic.properties.indexOf('writeWithoutResponse') !== -1) {
        properties |= 0x04;
      }

      if (characteristic.properties.indexOf('write') !== -1) {
        properties |= 0x08;
      }

      if (characteristic.properties.indexOf('notify') !== -1) {
        properties |= 0x10;
      }

      handle++;
      var characteristicHandle = handle;

      handle++;
      var characteristicValueHandle = handle;

      this._handles[characteristicHandle] = {
        type: 'characteristic',
        uuid: characteristic.uuid,
        properties: properties,
        startHandle: characteristicHandle,
        valueHandle: characteristicValueHandle
      };

      this._handles[characteristicValueHandle] = {
        type: 'characteristicValue',
        handle: characteristicValueHandle,
        value: characteristic.value
      };
    }

    this._handles[serviceHandle].endHandle = handle;
  }

  var debugHandles = [];
  for (i = 0; i < this._handles.length; i++) {
    handle = this._handles[i];

    debugHandles[i] = {};
    for(j in handle) {
      if (j === 'value') {
        debugHandles[i][j] = 'Buffer(\'' + handle[j].toString('hex') + '\', \'hex\')';
      } else {
        debugHandles[i][j] = handle[j];
      }
    }
  }

  debug('handles = ' + JSON.stringify(debugHandles, null, 2));
};

L2capBle.prototype.errorResponse = function(opcode, handle, status) {
  var buf = new Buffer(5);

  buf.writeUInt8(ATT_OP_ERROR, 0);
  buf.writeUInt8(opcode, 1);
  buf.writeUInt16LE(handle, 2);
  buf.writeUInt8(status, 4);

  return buf;
};

L2capBle.prototype.handleRequest = function(request) {
  debug('handing request: ' + request.toString('hex'));

  var requestType = request[0];
  var response = null;

  switch(requestType) {
    case ATT_OP_MTU_REQ:
      response = this.handleMtuRequest(request);
      break;

    case ATT_OP_READ_BY_GROUP_REQ:
      response = this.handleReadByGroupRequest(request);
      break;

    case ATT_OP_READ_BY_TYPE_REQ:
      response = this.handleReadByTypeRequest(request);
      break;

    case ATT_OP_READ_REQ:
      response = this.handleReadRequest(request);
      break;

    default:
      response = this.errorResponse(requestType, 0x0000, ATT_ECODE_REQ_NOT_SUPP);
      break;
  }

  if (response) {
    debug('response: ' + response.toString('hex'));

    this._l2capBle.stdin.write(response.toString('hex') + '\n');
  }
};

L2capBle.prototype.handleMtuRequest = function(request) {
  var mtu = request.readUInt16LE(1);

  this._mtu = mtu;

  var response = new Buffer(3);

  response.writeUInt8(ATT_OP_MTU_RESP, 0);
  response.writeUInt16LE(mtu, 1);

  return response;
};

L2capBle.prototype.handleReadByGroupRequest = function(request) {
  var response = null;

  var startHandle = request.readUInt16LE(1);
  var endHandle = request.readUInt16LE(3);
  var uuid = request.slice(5).toString('hex').match(/.{1,2}/g).reverse().join('');

  debug('read by group: startHandle = 0x' + startHandle.toString(16) + ', endHandle = 0x' + endHandle.toString(16) + ', uuid = 0x' + uuid.toString(16));

  if ('2800' === uuid || '2802' === uuid) {
    var services = [];
    var type = ('2800' === uuid) ? 'service' : 'includedService';
    var i;

    for (i = startHandle; i < endHandle; i++) {
      var handle = this._handles[i];

      if (!handle) {
        break;
      }

      if (handle.type === type) {
        services.push(handle);
      }
    }

    if (services.length) {
      var uuidSize = services[0].uuid.length / 2;
      var numServices = 1;
      
      for (i = 1; i < services.length; i++) {
        if (services[0].uuid.length !== services[i].uuid.length) {
          break;
        }
        numServices++;
      }

      var lengthPerService = (uuidSize === 2) ? 6 : 20;
      var maxServices = (this._mtu - 2) / lengthPerService;
      numServices = Math.min(numServices, maxServices);

      response = new Buffer(2 + numServices * lengthPerService);

      response[0] = ATT_OP_READ_BY_GROUP_RESP;
      response[1] = lengthPerService;

      for (i = 0; i < numServices; i++) {
        var service = services[i];

        response.writeUInt16LE(service.startHandle, 2 + i * lengthPerService);
        response.writeUInt16LE(service.endHandle, 2 + i * lengthPerService + 2);

        var serviceUuid = new Buffer(service.uuid.match(/.{1,2}/g).reverse().join(''), 'hex');
        for (var j = 0; j < serviceUuid.length; j++) {
          response[2 + i * lengthPerService + 4 + j] = serviceUuid[j];
        }
      }
    } else {
      response = this.errorResponse(ATT_OP_READ_BY_GROUP_REQ, startHandle, ATT_ECODE_ATTR_NOT_FOUND);
    }
  } else {
    response = this.errorResponse(ATT_OP_READ_BY_GROUP_REQ, startHandle, ATT_ECODE_UNSUPP_GRP_TYPE);
  }

  return response;
};

L2capBle.prototype.handleReadByTypeRequest = function(request) {
  var response = null;

  var startHandle = request.readUInt16LE(1);
  var endHandle = request.readUInt16LE(3);
  var uuid = request.slice(5).toString('hex').match(/.{1,2}/g).reverse().join('');
  var i;
  var handle;

  debug('read by type: startHandle = 0x' + startHandle.toString(16) + ', endHandle = 0x' + endHandle.toString(16) + ', uuid = 0x' + uuid.toString(16));

  if ('2803' === uuid) {
    var characteristics = [];

    for (i = startHandle; i < endHandle; i++) {
      handle = this._handles[i];

      if (!handle) {
        break;
      }

      if (handle.type === 'characteristic') {
        characteristics.push(handle);
      }
    }

    if (characteristics.length) {
      var uuidSize = characteristics[0].uuid.length / 2;
      var numCharacteristics = 1;
      
      for (i = 1; i < characteristics.length; i++) {
        if (characteristics[0].uuid.length !== characteristics[i].uuid.length) {
          break;
        }
        numCharacteristics++;
      }

      var lengthPerCharacteristic = (uuidSize === 2) ? 7 : 21;
      var maxCharacteristics = (this._mtu - 2) / lengthPerCharacteristic;
      numCharacteristics = Math.min(numCharacteristics, maxCharacteristics);

      response = new Buffer(2 + numCharacteristics * lengthPerCharacteristic);

      response[0] = ATT_OP_READ_BY_TYPE_RESP;
      response[1] = lengthPerCharacteristic;

      for (i = 0; i < numCharacteristics; i++) {
        var characteristic = characteristics[i];

        response.writeUInt16LE(characteristic.startHandle, 2 + i * lengthPerCharacteristic);
        response.writeUInt8(characteristic.properties, 2 + i * lengthPerCharacteristic + 2);
        response.writeUInt16LE(characteristic.valueHandle, 2 + i * lengthPerCharacteristic + 3);

        var characteristicUuid = new Buffer(characteristic.uuid.match(/.{1,2}/g).reverse().join(''), 'hex');
        for (var j = 0; j < characteristicUuid.length; j++) {
          response[2 + i * lengthPerCharacteristic + 5 + j] = characteristicUuid[j];
        }
      }
    } else {
      response = this.errorResponse(ATT_OP_READ_BY_TYPE_REQ, startHandle, ATT_ECODE_ATTR_NOT_FOUND);
    }
  } else {
    var valueHandle = null;

    for (i = startHandle; i < endHandle; i++) {
      handle = this._handles[i];

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

      var dataLength = Math.min(data.length, this._mtu - 4);
      response = new Buffer(4 + dataLength);

      response[0] = ATT_OP_READ_BY_TYPE_RESP;
      response[1] = 0x01;
      response.writeUInt16LE(valueHandle, 2);

      for (i = 0; i < dataLength; i++) {
        response[i + 4] = data[i];
      }
    } else {
      response = this.errorResponse(ATT_OP_READ_BY_TYPE_REQ, startHandle, ATT_ECODE_ATTR_NOT_FOUND);
    }
  }

  return response;
};

L2capBle.prototype.handleReadRequest = function(request) {
  var response = null;

  var valueHandle = request.readUInt16LE(1);
  var handle = this._handles[valueHandle];

  if (handle && handle.type === 'characteristicValue') {
    var data = this._handles[valueHandle].value;

    var dataLength = Math.min(data.length, this._mtu - 1);
    response = new Buffer(1 + dataLength);

    response[0] = ATT_OP_READ_RESP;
    for (var i = 0; i < dataLength; i++) {
      response[1 + i] = data[i];
    }
  } else {
    response = this.errorResponse(ATT_OP_READ_REQ, valueHandle, ATT_ECODE_INVALID_HANDLE);
  }

  return response;
};

module.exports = L2capBle;
