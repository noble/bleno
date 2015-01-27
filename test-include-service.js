var util = require('util');

var bleno = require('./index');


var BlenoPrimaryService = bleno.PrimaryService;
var BlenoSecondaryService = bleno.SecondaryService;
var BlenoCharacteristic = bleno.Characteristic;
var BlenoDescriptor = bleno.Descriptor;

console.log('bleno');

var testSecondaryServiceA = new BlenoSecondaryService({
  uuid: 'aa00',
  characteristics: [
    new BlenoCharacteristic({
      uuid: 'aa01',
      properties: ['read'],
      value: new Buffer('a')
    })
  ]
});

var testSecondaryServiceB = new BlenoSecondaryService({
  uuid: 'bb00',
  characteristics: [
    new BlenoCharacteristic({
      uuid: 'bb01',
      properties: ['read'],
      value: new Buffer('b')
    })
  ]
});

var testPrimaryServiceA = new BlenoPrimaryService({
  uuid: 'aaa0',
  characteristics: [
    new BlenoCharacteristic({
      uuid: 'aaa1',
      properties: ['read'],
      value: new Buffer('primary')
    })
  ],
  included: [
    testSecondaryServiceA
  ]
});

var testPrimaryServiceB = new BlenoPrimaryService({
  uuid: 'bbb0',
  characteristics: [
    new BlenoCharacteristic({
      uuid: 'bbb1',
      properties: ['read'],
      value: new Buffer('primary')
    })
  ],
  included: [
    testSecondaryServiceB
  ]
});

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising('test', ['fff0']);
  } else {
    bleno.stopAdvertising();
  }
});

// Linux only events /////////////////
bleno.on('accept', function(clientAddress) {
  console.log('on -> accept, client: ' + clientAddress);

  if (bleno.updateRssi) {
    bleno.updateRssi();
  }
});

bleno.on('disconnect', function(clientAddress) {
  console.log('on -> disconnect, client: ' + clientAddress);
});

bleno.on('rssiUpdate', function(rssi) {
  console.log('on -> rssiUpdate: ' + rssi);
});
//////////////////////////////////////

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    bleno.setServices([
      testSecondaryServiceA,
      testPrimaryServiceA,
      testSecondaryServiceB,
      testPrimaryServiceB
    ]);
  }
});

bleno.on('advertisingStop', function() {
  console.log('on -> advertisingStop');
});

bleno.on('servicesSet', function() {
  console.log('on -> servicesSet');
});
