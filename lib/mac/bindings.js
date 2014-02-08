/*jshint loopfunc: true */

var debug = require('debug')('bindings');

var events = require('events');
var os = require('os');
var util = require('util');

var XpcConnection = require('xpc-connection');

var BlenoBindings = function() {
  this._xpcConnection = new XpcConnection('com.apple.blued');

  this._xpcConnection.on('error', function(message) {
    this.emit('xpcError', message);
  }.bind(this));

  this._xpcConnection.on('event', function(event) {
    this.emit('xpcEvent', event);
  }.bind(this));
};

util.inherits(BlenoBindings, events.EventEmitter);

BlenoBindings.prototype.setupXpcConnection = function() {
  this._xpcConnection.setup();
};

BlenoBindings.prototype.sendXpcMessage = function(message) {
  this._xpcConnection.sendMessage(message);
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
  this.timer = setTimeout(function(){}, 2147483647); // TODO: add worker in bindings instead

  var osRelease = parseFloat(os.release());

  if (osRelease < 13) {
    debug('bleno warning: OS X < 10.9 detected');

    console.warn('bleno requires OS X 10.9 or higher!');

    this.emit('stateChange', 'unsupported');
  } else {
    this.sendCBMsg(1, {
      kCBMsgArgName: 'node-' + (new Date()).getTime(),
      kCBMsgArgOptions: {
          kCBInitOptionShowPowerAlert: 1
      },
      kCBMsgArgType: 1
    });
  }
};

blenoBindings.on('kCBMsgId6', function(args) {
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

  this.sendCBMsg(8, advertisement);
};

blenoBindings.startAdvertisingIBeacon = function(data) {
  this.sendCBMsg(8, {
    kCBAdvDataAppleBeaconKey: data
  });
};

blenoBindings.on('kCBMsgId16', function(args) {
  var result = args.kCBMsgArgResult;
  var error = null;

  if (result) {
    error = new Error('Unknown error (result ' + result + ')');
  }

  this.emit('advertisingStart', error);
});

blenoBindings.stopAdvertising = function() {
  this.sendCBMsg(9, null);
};

blenoBindings.on('kCBMsgId17', function(args) {
  this.emit('advertisingStop');
});

blenoBindings.setServices = function(services) {
  this.sendCBMsg(12, null); // remove all services

  services = services || [];
  var attributeId = 1;

  this._attributes = [];

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

      this.sendCBMsg(10, arg);
    }
  } else {
    this.emit('servicesSet');
  }
};

blenoBindings.on('kCBMsgId18', function(args) {
  var attributeId = args.kCBMsgArgAttributeID;

  if (attributeId === this._lastServiceAttributeId) {
    this.emit('servicesSet');
  }
});

blenoBindings.on('kCBMsgId19', function(args) {
  var attributeId = args.kCBMsgArgAttributeID;
  var offset = args.kCBMsgArgOffset || 0;
  var transactionId = args.kCBMsgArgTransactionID;

  var callback = (function(attributeId, transactionId) {
    return function(result, data) {
      this.sendCBMsg(13, {
        kCBMsgArgAttributeID: attributeId,
        kCBMsgArgData: data,
        kCBMsgArgResult: result,
        kCBMsgArgTransactionID: transactionId
      });
    }.bind(this);
  }.bind(this))(attributeId, transactionId);

  this._attributes[attributeId].emit('readRequest', offset, callback);
});

blenoBindings.on('kCBMsgId20', function(args) {
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
          this.sendCBMsg(13, {
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

blenoBindings.on('kCBMsgId21', function(args) {
  var attributeId = args.kCBMsgArgAttributeID;
  var maxValueSize = 20;

  var callback = (function(attributeId) {
    return function(data) {
      this.sendCBMsg(15, {
        kCBMsgArgAttributeID: attributeId,
        kCBMsgArgData: data,
        kCBMsgArgUUIDs: []
      });
    }.bind(this);
  }.bind(this))(attributeId);

  this._attributes[attributeId].emit('subscribe', maxValueSize, callback);
});

blenoBindings.on('kCBMsgId22', function(args) {
  var attributeId = args.kCBMsgArgAttributeID;

  this._attributes[attributeId].emit('unsubscribe');
});

blenoBindings.on('kCBMsgId23', function(args) {
  var attributeId = args.kCBMsgArgAttributeID;

  this._attributes[attributeId].emit('notify');
});


blenoBindings.setupXpcConnection();
blenoBindings.init();

module.exports = blenoBindings;
