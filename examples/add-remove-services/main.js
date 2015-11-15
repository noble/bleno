var bleno = require('../..');

var BlenoPrimaryService = bleno.PrimaryService;

var EchoCharacteristic = require('../echo/characteristic');

console.log('bleno - add/remove service echo');

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising('echo', ['ec00']);
  } else {
    bleno.stopAdvertising();
  }
});

var service1 = new BlenoPrimaryService({
  uuid: 'ec00',
  characteristics: [
    new EchoCharacteristic()
  ]
});

var service2 = new BlenoPrimaryService({
  uuid: 'ec01',
  characteristics: [
    new EchoCharacteristic()
  ]
});

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    bleno.addService(service1);
  }

  var flip = false;
  setInterval(function () {
    if (flip) {
      bleno.removeService(service2);
    } else {
      bleno.addService(service2);
    }

    flip = !flip;
  }, 10 * 1000);
});
