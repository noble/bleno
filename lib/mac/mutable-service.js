var util                  = require('util');

var CoreBluetooth         = require('core-bluetooth');

var MutableCharacteristic = require('./mutable-characteristic');

function MutableService(blenoService) {
  var characteristics = [];

  for (var i = 0; i < blenoService.characteristics.length; i++) {
    characteristics[i] = new MutableCharacteristic(blenoService.characteristics[i]);
  }

  MutableService.super_.call(this, blenoService.uuid, true, [], characteristics);

  this._blenoService = blenoService;
}

util.inherits(MutableService, CoreBluetooth.MutableService);

module.exports = MutableService;
