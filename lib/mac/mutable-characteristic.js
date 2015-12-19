var util                  = require('util');

var CoreBluetooth         = require('core-bluetooth');

function MutableCharacteristic(blenoCharacteristic) {
  var properties = 0;
  var permissions = 0;
  var descriptors = [];

  if (blenoCharacteristic.properties.indexOf('read') !== -1) {
    properties |= 0x02;

    if (blenoCharacteristic.secure.indexOf('read') !== -1) {
      permissions |= 0x04;
    } else {
      permissions |= 0x01;
    }
  }

  if (blenoCharacteristic.properties.indexOf('writeWithoutResponse') !== -1) {
    properties |= 0x04;

    if (blenoCharacteristic.secure.indexOf('writeWithoutResponse') !== -1) {
      permissions |= 0x08;
    } else {
      permissions |= 0x02;
    }
  }

  if (blenoCharacteristic.properties.indexOf('write') !== -1) {
    properties |= 0x08;

    if (blenoCharacteristic.secure.indexOf('write') !== -1) {
      permissions |= 0x08;
    } else {
      permissions |= 0x02;
    }
  }

  if (blenoCharacteristic.properties.indexOf('notify') !== -1) {
    if (blenoCharacteristic.secure.indexOf('notify') !== -1) {
      properties |= 0x100;
    } else {
      properties |= 0x10;
    }
  }

  if (blenoCharacteristic.properties.indexOf('indicate') !== -1) {
    if (blenoCharacteristic.secure.indexOf('indicate') !== -1) {
      properties |= 0x200;
    } else {
      properties |= 0x20;
    }
  }

  for (var i = 0; i < blenoCharacteristic.descriptors.length; i++) {
    var descriptor = blenoCharacteristic.descriptors[i];

    descriptors[i] = new CoreBluetooth.MutableDescriptor(descriptor.uuid, descriptor.value);
  }

  MutableCharacteristic.super_.call(this, blenoCharacteristic.uuid, properties, blenoCharacteristic.value, permissions, descriptors);

  this._blenoCharacteristic = blenoCharacteristic;
}

util.inherits(MutableCharacteristic, CoreBluetooth.MutableCharacteristic);

MutableCharacteristic.prototype.onReadRequest = function(transactionId, offset) {
  this._blenoCharacteristic.emit('readRequest', offset, function(result, data) {
    this.peripheralManager.respondToRequest(transactionId, result, data);
  }.bind(this));
};

MutableCharacteristic.prototype.onWriteRequest = function(transactionId, offset, value, ignoreResponse) {
  this._blenoCharacteristic.emit('writeRequest', value, offset, ignoreResponse, function(result) {
    this.peripheralManager.respondToRequest(transactionId, result);
  }.bind(this));
};

MutableCharacteristic.prototype.onSubscribe = function(centralIdentifier, maximumUpdateValueLength) {
  this._blenoCharacteristic.emit('subscribe', maximumUpdateValueLength, function(value) {
    this.peripheralManager.updateValueForCharacteristic(this, value);
  }.bind(this));
};

MutableCharacteristic.prototype.onUnsubscribe = function(centralIdentifier) {
  this._blenoCharacteristic.emit('unsubscribe');
};

MutableCharacteristic.prototype.onValueUpdate = function() {
  if (this.properties & 0x10) {
    this._blenoCharacteristic.emit('notify');
  }

  if (this.properties & 0x20) {
    this._blenoCharacteristic.emit('indicate');
  }
};

module.exports = MutableCharacteristic;
