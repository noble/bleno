var util = require('util');

var bleno = require('./index');


var BlenoPrimaryService = bleno.PrimaryService;
var BlenoCharacteristic = bleno.Characteristic;
var BlenoDescriptor = bleno.Descriptor;

console.log('bleno');

var StaticReadOnlyCharacteristic = function() {
  BlenoCharacteristic.call(this, {
    uuid: '00000000000000000000000000000001',
    properties: ['read'],
    value: new Buffer('value'),
    descriptors: [
      new BlenoDescriptor({
        uuid: '2901',
        value: 'user description'
      })
    ]
  });
};
util.inherits(StaticReadOnlyCharacteristic, BlenoCharacteristic);

var DynamicReadOnlyCharacteristic = function() {
  BlenoCharacteristic.call(this, {
    uuid: '00000000000000000000000000000002',
    properties: ['read']
  });
};

util.inherits(DynamicReadOnlyCharacteristic, BlenoCharacteristic);

DynamicReadOnlyCharacteristic.prototype.onReadRequest = function(offset, callback) {
  var result = this.RESULT_SUCCESS;
  var data = new Buffer('dynamic value');

  if (offset > data.length) {
    result = this.RESULT_INVALID_OFFSET;
    data = null;
  }

  callback(result, data);
};

var CustomWriteOnlyCharacteristic = function() {
  BlenoCharacteristic.call(this, {
    uuid: '00000000000000000000000000000003',
    properties: ['write', 'writeWithoutResponse']
  });
};

util.inherits(CustomWriteOnlyCharacteristic, BlenoCharacteristic);

CustomWriteOnlyCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
  console.log('CustomWriteOnlyCharacteristic write request: ' + data.toString('hex') + ' ' + offset + ' ' + withoutResponse);

  callback(this.RESULT_SUCCESS);
};


bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising('test', ['00000000000000000000000000000000']);
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function() {
  console.log('on -> advertisingStart');

  bleno.setServices([
    new BlenoPrimaryService({
      uuid: '00000000000000000000000000000000',
      characteristics: [
        new StaticReadOnlyCharacteristic(),   
        new DynamicReadOnlyCharacteristic(),
        new CustomWriteOnlyCharacteristic()
      ]
    })
  ]);
});

bleno.on('advertisingStop', function() {
  console.log('on -> advertisingStop');
});

bleno.on('servicesSet', function() {
  console.log('on -> servicesSet');
});
