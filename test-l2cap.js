var util = require('util');

var bleno = require('./index');


var BlenoPrimaryService = bleno.PrimaryService;
var BlenoCharacteristic = bleno.Characteristic;
var BlenoDescriptor = bleno.Descriptor;

console.log('bleno');

var StaticReadOnlyCharacteristic = function() {
  StaticReadOnlyCharacteristic.super_.call(this, {
    uuid: 'ABDD305628FA441DA47055A75A52553A',
    properties: ['read'],
    value: new Buffer('c000', 'hex')
  });
};
util.inherits(StaticReadOnlyCharacteristic, BlenoCharacteristic);

function SampleService() {
  SampleService.super_.call(this, {
    uuid: '181E4304CFD346658CC90AA8F18D9298',
    characteristics: [
      new StaticReadOnlyCharacteristic()
    ]
  });
}

util.inherits(SampleService, BlenoPrimaryService);

bleno.publishL2CAPChannel(0x00c0, (success, error) => {
  if (!success) {
    console.log('Failed to publish channel, error: '+error);
  } else {
    console.log('Successfully publish channel');
  }
});

bleno.on('l2cap-newStream', (stream) => {
  console.log('New Stream - psm: ' + stream.psm);
  stream.on('data', (data)=> {
    console.log('stream data: ' + data.toString('hex'));
  })

  stream.on('invalidate', () => {
    console.log('invalidate stream');
  })

  var buffer = Buffer.alloc(2048);
  stream.write(buffer);
})

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state + ', address = ' + bleno.address);

  if (state === 'poweredOn') {
    bleno.startAdvertising('test', ['181E4304CFD346658CC90AA8F18D9298']);
  } else {
    bleno.stopAdvertising();
  }
});

// Linux only events /////////////////
bleno.on('accept', function(clientAddress) {
  console.log('on -> accept, client: ' + clientAddress);

  bleno.updateRssi();
});

bleno.on('disconnect', function(clientAddress) {
  console.log('on -> disconnect, client: ' + clientAddress);
});

bleno.on('rssiUpdate', function(rssi) {
  console.log('on -> rssiUpdate: ' + rssi);
});
//////////////////////////////////////

bleno.on('mtuChange', function(mtu) {
  console.log('on -> mtuChange: ' + mtu);
});

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    bleno.setServices([
      new SampleService()
    ]);
  }
});

bleno.on('advertisingStop', function() {
  console.log('on -> advertisingStop');
});

bleno.on('servicesSet', function(error) {
  console.log('on -> servicesSet: ' + (error ? 'error ' + error : 'success'));
});