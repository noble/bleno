var util = require('util');

var bleno = require('../..');

var BlenoPrimaryService = bleno.PrimaryService;

var BatteryLevelCharacteristic = require('./battery-level-characteristic');

function BatteryService() {
  BatteryService.super_.call(this, {
      uuid: '180F',
      characteristics: [
          new BatteryLevelCharacteristic()
      ]
  });
}

util.inherits(BatteryService, BlenoPrimaryService);

module.exports = BatteryService;
