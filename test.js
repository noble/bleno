var bleno = require('./index');
var BlenoPrimaryService = bleno.PrimaryService;
var BlenoCharacteristic = bleno.Characteristic;
var BlenoDescriptor = bleno.Descriptor;

console.log('bleno');

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
        new BlenoCharacteristic({
          uuid: '00000000000000000000000000000001',
          properties: ['read'],
          value: new Buffer('value'),
          descriptors: [
            new BlenoDescriptor({
              uuid: '2901',
              value: 'user description'
            })
          ]
        })
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
