var util = require('util');

var bleno = require('../..');
var BlenoPrimaryService = bleno.PrimaryService;

var SerialNumberCharacteristic = require('./serial-number-characteristic');
var HardwareRevisionCharacteristic = require('./hardware-revision-characteristic');

function DeviceInformationService(blink1) {
  DeviceInformationService.super_.call(this, {
    uuid: '180a',
    characteristics: [
      new SerialNumberCharacteristic(blink1),
      new HardwareRevisionCharacteristic(blink1)
    ]
  });
}

util.inherits(DeviceInformationService, BlenoPrimaryService);

module.exports = DeviceInformationService;
