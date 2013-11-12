var util = require('util');

var bleno = require('../..');
var BlenoCharacteristic = bleno.Characteristic;
var BlenoDescriptor = bleno.Descriptor;

function Blink1RGBCharacteristic(blink1) {
  Blink1RGBCharacteristic.super_.call(this, {
    uuid: '01010101010101010101010101524742',
    properties: ['write', 'writeWithoutResponse'],
    descriptors: [
      new BlenoDescriptor({
        uuid: '2901',
        value: 'set blink(1) RGB value'
      })
    ]
  });

  this.blink1 = blink1;
}

util.inherits(Blink1RGBCharacteristic, BlenoCharacteristic);

Blink1RGBCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
  if (offset) {
    callback(this.RESULT_ATTR_NOT_LONG);
  } else if (data.length !== 3) {
    callback(this.RESULT_INVALID_ATTRIBUTE_LENGTH);
  } else {
    var r = data.readUInt8(0);
    var g = data.readUInt8(1);
    var b = data.readUInt8(2);

    this.blink1.setRGB(r, g, b, function() {
      callback(this.RESULT_SUCCESS);
    }.bind(this));
  }
};

module.exports = Blink1RGBCharacteristic;
