var util = require('util');

var bleno = require('../..');
var BlenoCharacteristic = bleno.Characteristic;
var BlenoDescriptor = bleno.Descriptor;

function Blink1FaceRGBCharacteristic(blink1) {
  Blink1FaceRGBCharacteristic.super_.call(this, {
    uuid: '01010101010101010166616465524742',
    properties: ['write', 'writeWithoutResponse', 'notify'],
    descriptors: [
      new BlenoDescriptor({
        uuid: '2901',
        value: 'fade blink(1) RGB value'
      })
    ]
  });

  this.blink1 = blink1;
}

util.inherits(Blink1FaceRGBCharacteristic, BlenoCharacteristic);

Blink1FaceRGBCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
  if (offset) {
    callback(this.RESULT_ATTR_NOT_LONG);
  } else if (data.length !== 5) {
    callback(this.RESULT_INVALID_ATTRIBUTE_LENGTH);
  } else {
    var fadeMillis = data.readUInt16LE(0);
    var r = data.readUInt8(2);
    var g = data.readUInt8(3);
    var b = data.readUInt8(4);

    this.blink1.fadeToRGB(fadeMillis, r, g, b, function() {
      if (this.updateValueCallback) {
        this.updateValueCallback(new Buffer([r, g, b]));
      }
    }.bind(this));

    callback(this.RESULT_SUCCESS);
  }
};

module.exports = Blink1FaceRGBCharacteristic;
