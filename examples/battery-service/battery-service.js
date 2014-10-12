var util = require('util'),
  bleno = require('bleno'),
  BlenoPrimaryService = bleno.PrimaryService,
  BatteryLevelCharacteristic = require('./battery-level-characteristic');

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
