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
          kCBInitOptionShowPowerAlert: 0
      },
      kCBMsgArgType: 0
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

blenoBindings.on('kCBMsgId16', function(args) {
  this.emit('advertisingStart');
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

      this._lastServiceAttributeId = attributeId;
      attributeId++;

      for (var j = 0; j < service.characteristics.length; j++) {
        var characteristic = service.characteristics[j];

        var properties = 0;
        var permissions = 0;

        if (characteristic.properties.indexOf('read') !== -1) {
          permissions |= 0x01;
          properties |= 0x02;
        }

        if (characteristic.properties.indexOf('writeWithoutResponse') !== -1) {
          permissions |= 0x02;
          properties |= 0x04;
        }

        if (characteristic.properties.indexOf('write') !== -1) {
          permissions |= 0x02;
          properties |= 0x08;
        }

        if (characteristic.properties.indexOf('notify') !== -1) {
          properties |= 0x10;
        }

        arg.kCBMsgArgCharacteristics.push({
          kCBMsgArgAttributeID: attributeId,
          kCBMsgArgAttributePermissions: permissions, 
          kCBMsgArgCharacteristicProperties: properties,
          kCBMsgArgData: characteristic.value,
          kCBMsgArgDescriptors: [],
          kCBMsgArgUUID: new Buffer(characteristic.uuid, 'hex')
        });

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

blenoBindings.setupXpcConnection();
blenoBindings.init();

module.exports = blenoBindings;
