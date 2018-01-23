/*jshint loopfunc: true */

var debug = require('debug')('highsierra-bindings');

var child_process = require('child_process');
var events = require('events');
var os = require('os');
var util = require('util');

var XpcConnection = require('xpc-connection');

var uuidToAddress = require('./uuid-to-address');

var osRelease = parseFloat(os.release());

var BlenoBindings = function() {
  this._xpcConnection = new XpcConnection('com.apple.blued');
  this._deviceUUID = null;

  this._xpcConnection.on('error', function(message) {
    this.emit('xpcError', message);
  }.bind(this));

  this._xpcConnection.on('event', function(event) {
    this.emit('xpcEvent', event);
  }.bind(this));
};

util.inherits(BlenoBindings, events.EventEmitter);

BlenoBindings.prototype.sendXpcMessage = function(message) {
  this._xpcConnection.sendMessage(message);
};

BlenoBindings.prototype.disconnect = function() {
  throw new Error('disconnect is not supported on OS X!');
};

var blenoBindings = new BlenoBindings();

blenoBindings.on('xpcEvent', function(event) {
  var kCBMsgId = event.kCBMsgId;
  var kCBMsgArgs = event.kCBMsgArgs;

  debug('xpcEvent: ' + JSON.stringify(event, undefined, 2));

  this.emit('kCBMsgId' + kCBMsgId, kCBMsgArgs);
});

blenoBindings.on('xpcError', function(message) {
  console.error('xpcError: ' + message);
});

blenoBindings.sendCBMsg = function(id, args) {
  debug('sendCBMsg: ' + id + ', ' + JSON.stringify(args, undefined, 2));
  this.sendXpcMessage({
    kCBMsgId: id,
    kCBMsgArgs: args
  });
};

blenoBindings.init = function() {
  this._xpcConnection.setup();

  child_process.exec('system_profiler SPBluetoothDataType', {}, function(error, stdout, stderr) {
    this.emit('platform', os.platform());

    if (!error) {
      var found = stdout.match(/\s+Address: (.*)/);
      if (found) {
        var address = found[1].toLowerCase().replace(/-/g, ':');

        this.emit('addressChange', address);
      }
    }

    this.sendCBMsg(1, {
      kCBMsgArgName: 'node-' + (new Date()).getTime(),
      kCBMsgArgOptions: {
          kCBInitOptionShowPowerAlert: 1
      },
      kCBMsgArgType: 1
    });

  }.bind(this));
};

blenoBindings.on('kCBMsgId4', function(args) {
  var state = ['unknown', 'resetting', 'unsupported', 'unauthorized', 'poweredOff', 'poweredOn'][args.kCBMsgArgState];
  debug('state change ' + state);
  this.emit('stateChange', state);
});

blenoBindings.startAdvertising = function(name, serviceUuids) {
  var advertisement = {
    kCBAdvDataLocalName: name,
    kCBAdvDataServiceUUIDs: []
  };

  if (serviceUuids && serviceUuids.length) {
    for(var i = 0; i < serviceUuids.length; i++) {
      advertisement.kCBAdvDataServiceUUIDs[i] = new Buffer(serviceUuids[i], 'hex');
    }
  }

  this.sendCBMsg(16, advertisement);
};

blenoBindings.startAdvertisingIBeacon = function(data) {
  var args = {};

  args.kCBAdvDataAppleMfgData = Buffer.concat([
    new Buffer([data.length + 5, 0xff, 0x4c, 0x00, 0x02, data.length]),
    data
  ]);

  this.sendCBMsg(16, args);
};

blenoBindings.startAdvertisingWithEIRData = function(advertisementData) {
  this.sendCBMsg(16, {
    kCBAdvDataAppleMfgData: advertisementData
  });
};

blenoBindings.on('kCBMsgId27', function(args) {
  var result = args.kCBMsgArgResult;
  var error = null;

  if (result) {
    error = new Error('Unknown error (result ' + result + ')');
  }

  this.emit('advertisingStart', error);
});

blenoBindings.stopAdvertising = function() {
  this.sendCBMsg(17, null);
};

blenoBindings.on('kCBMsgId28', function(args) {
  this.emit('advertisingStop');
});

blenoBindings.setServices = function(services) {
  this.sendCBMsg(19, null); // remove all services

  services = services || [];
  var attributeId = 1;

  this._attributes = [];
  this._setServicesError = undefined;

  if (services.length) {
    for (var i = 0; i < services.length; i++) {
      var service = services[i];

      var arg = {
        kCBMsgArgAttributeID: attributeId,
        kCBMsgArgAttributeIDs: [],
        kCBMsgArgCharacteristics: [],
        kCBMsgArgType: 1, // 1 => primary, 0 => included
        kCBMsgArgUUID: new Buffer(service.uuid, 'hex')
      };

      this._attributes[attributeId] = service;

      this._lastServiceAttributeId = attributeId;
      attributeId++;

      for (var j = 0; j < service.characteristics.length; j++) {
        var characteristic = service.characteristics[j];

        var properties = 0;
        var permissions = 0;

        if (characteristic.properties.indexOf('read') !== -1) {
          properties |= 0x02;

          if (characteristic.secure.indexOf('read') !== -1) {
            permissions |= 0x04;
          } else {
            permissions |= 0x01;
          }
        }

        if (characteristic.properties.indexOf('writeWithoutResponse') !== -1) {
          properties |= 0x04;

          if (characteristic.secure.indexOf('writeWithoutResponse') !== -1) {
            permissions |= 0x08;
          } else {
            permissions |= 0x02;
          }
        }

        if (characteristic.properties.indexOf('write') !== -1) {
          properties |= 0x08;

          if (characteristic.secure.indexOf('write') !== -1) {
            permissions |= 0x08;
          } else {
            permissions |= 0x02;
          }
        }

        if (characteristic.properties.indexOf('notify') !== -1) {
          if (characteristic.secure.indexOf('notify') !== -1) {
            properties |= 0x100;
          } else {
            properties |= 0x10;
          }
        }

        if (characteristic.properties.indexOf('indicate') !== -1) {
          if (characteristic.secure.indexOf('indicate') !== -1) {
            properties |= 0x200;
          } else {
            properties |= 0x20;
          }
        }

        var characteristicArg = {
          kCBMsgArgAttributeID: attributeId,
          kCBMsgArgAttributePermissions: permissions,
          kCBMsgArgCharacteristicProperties: properties,
          kCBMsgArgData: characteristic.value,
          kCBMsgArgDescriptors: [],
          kCBMsgArgUUID: new Buffer(characteristic.uuid, 'hex')
        };

        this._attributes[attributeId] = characteristic;

        for (var k = 0; k < characteristic.descriptors.length; k++) {
          var descriptor = characteristic.descriptors[k];

          characteristicArg.kCBMsgArgDescriptors.push({
            kCBMsgArgData: descriptor.value,
            kCBMsgArgUUID: new Buffer(descriptor.uuid, 'hex')
          });
        }

        arg.kCBMsgArgCharacteristics.push(characteristicArg);

        attributeId++;
      }

      this.sendCBMsg(18, arg);
    }
  } else {
    this.emit('servicesSet');
  }
};

blenoBindings.updateRssi = function() {
  if (this._deviceUUID === null) {
    this.emit('rssiUpdate', 127); // not supported
  } else {
    this.sendCBMsg(61, {
      kCBMsgArgDeviceUUID: this._deviceUUID
    });
  }
};

blenoBindings.on('kCBMsgId29', function(args) {
  var attributeId = args.kCBMsgArgAttributeID;
  var result = args.kCBMsgArgResult;

  if (result) {
    var errorMessage = 'failed to set service ' + this._attributes[attributeId].uuid;

    if (result === 27) {
      errorMessage += ', UUID not allowed!';
    }

    this._setServicesError = new Error(errorMessage);
  }

  if (attributeId === this._lastServiceAttributeId) {
    this.emit('servicesSet',  this._setServicesError);
  }
});

blenoBindings.on('kCBMsgId57', function(args) {
  var deviceUUID = args.kCBMsgArgDeviceUUID.toString('hex');
  var mtu = args.kCBMsgArgATTMTU;

  this._deviceUUID = new Buffer(deviceUUID, 'hex');
  this._deviceUUID.isUuid = true;

  uuidToAddress(deviceUUID, function(error, address) {
    this.emit('accept', address);
    this.emit('mtuChange', mtu);
  }.bind(this));
});

blenoBindings.on('kCBMsgId30', function(args) {
  var attributeId = args.kCBMsgArgAttributeID;
  var offset = args.kCBMsgArgOffset || 0;
  var transactionId = args.kCBMsgArgTransactionID;

  var callback = (function(attributeId, transactionId) {
    return function(result, data) {
      this.sendCBMsg(21, {
        kCBMsgArgAttributeID: attributeId,
        kCBMsgArgData: data,
        kCBMsgArgResult: result,
        kCBMsgArgTransactionID: transactionId
      });
    }.bind(this);
  }.bind(this))(attributeId, transactionId);

  this._attributes[attributeId].emit('readRequest', offset, callback);
});

blenoBindings.on('kCBMsgId31', function(args) {
  var attWrites = args.kCBMsgArgATTWrites;
  var transactionId = args.kCBMsgArgTransactionID;

  for (var i = 0; i < attWrites.length; i++) {
    var attWrite = attWrites[i];

    var attributeId = attWrite.kCBMsgArgAttributeID;
    var data = attWrite.kCBMsgArgData;
    var ignoreResponse = attWrite.kCBMsgArgIgnoreResponse ? true : false;
    var offset = args.kCBMsgArgOffset || 0;

    var callback = (function(attributeId, transactionId, ignoreResponse) {
      return function(result) {
        if (!ignoreResponse) {
          this.sendCBMsg(21, {
            kCBMsgArgAttributeID: attributeId,
            kCBMsgArgData: null,
            kCBMsgArgResult: result,
            kCBMsgArgTransactionID: transactionId
          });
        }
      }.bind(this);
    }.bind(this))(attributeId, transactionId, ignoreResponse);

    this._attributes[attributeId].emit('writeRequest', data, offset, ignoreResponse, callback);
  }
});

blenoBindings.on('kCBMsgId32', function(args) {
  var attributeId = args.kCBMsgArgAttributeID;
  var maxValueSize = 20;

  var callback = (function(attributeId) {
    return function(data) {
      this.sendCBMsg(22, {
        kCBMsgArgAttributeID: attributeId,
        kCBMsgArgData: data,
        kCBMsgArgUUIDs: []
      });
    }.bind(this);
  }.bind(this))(attributeId);

  this._attributes[attributeId].emit('subscribe', maxValueSize, callback);
});

blenoBindings.on('kCBMsgId33', function(args) {
  var attributeId = args.kCBMsgArgAttributeID;

  this._attributes[attributeId].emit('unsubscribe');
});

blenoBindings.on('kCBMsgId34', function(args) {
  var attributeId = args.kCBMsgArgAttributeID;
  var attribute = this._attributes[attributeId];

  if (attribute.properties.indexOf('notify') !== -1) {
    attribute.emit('notify');
  }

  if (attribute.properties.indexOf('indicate') !== -1) {
    attribute.emit('indicate');
  }
});

blenoBindings.on('kCBMsgId71', function(args) {
  var rssi = args.kCBMsgArgData;

  this.emit('rssiUpdate', rssi);
});

module.exports = blenoBindings;
