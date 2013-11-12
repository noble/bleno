var util = require('util');

var bleno = require('../..');
var BlenoPrimaryService = bleno.PrimaryService;

var Blink1RGBCharacteristic = require('./blink1-rgb-characteristic');
var Blink1FadeRGBCharacteristic = require('./blink1-fade-rgb-characteristic');

function Blink1Service(blink1) {
  Blink1Service.super_.call(this, {
    uuid: '01010101010101010101010101010101',
    characteristics: [
      new Blink1RGBCharacteristic(blink1),
      new Blink1FadeRGBCharacteristic(blink1)
    ]
  });
}

util.inherits(Blink1Service, BlenoPrimaryService);

module.exports = Blink1Service;
