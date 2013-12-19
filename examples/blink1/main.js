var Blink1 = require('node-blink1');

var bleno = require('../..');

var DeviceInformationService = require('./device-information-service');
var Blink1Service = require('./blink1-service');

var blink1 = new Blink1();

var deviceInformationService = new DeviceInformationService(blink1);
var blink1Service = new Blink1Service(blink1);

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising('blink1', [blink1Service.uuid]);
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));
  
  if (!error) {
    bleno.setServices([
      deviceInformationService,
      blink1Service
    ]);
  }
});