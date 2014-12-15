var util = require('util'),
	bleno = require('bleno'),
	BlenoPrimaryService = bleno.PrimaryService,
	BlenoSecondaryService = bleno.SecondaryService,
	BatteryLevelCharacteristic = require('./battery-level-characteristic');

function BatteryService() {
	BatteryService.super_.call(this, {
		uuid: '180F',
		included: ['secondaryID'],
		characteristics: [
			new BatteryLevelCharacteristic()
		],
		relativeHandle: '10'
	});
}

util.inherits(BatteryService, BlenoPrimaryService);
module.exports = BatteryService;
