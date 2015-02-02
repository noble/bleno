var util = require('util'),
	bleno = require('bleno'),
	BlenoPrimaryService = bleno.PrimaryService,
	BlenoSecondaryService = bleno.SecondaryService,
	BatteryLevelCharacteristic = require('./battery-level-characteristic');

function BatterySecondaryServiceA() {
	BatterySecondaryServiceA.super_.call(this, {
		uuid: '180F',
		ID: 'secondaryID',
		included: ['secondaryIDB'],
		characteristics: [
			new BatteryLevelCharacteristic()
		],
		absoluteHandle: '0030'
	});
}

function BatterySecondaryServiceB() {
	BatterySecondaryServiceB.super_.call(this, {
		uuid: '180E',
		ID: 'secondaryIDB',
		characteristics: [
			new BatteryLevelCharacteristic()
		],
		absoluteHandle: '0040'
	});
}
util.inherits(BatterySecondaryServiceA, BlenoSecondaryService);
util.inherits(BatterySecondaryServiceB, BlenoSecondaryService);
module.exports.a = BatterySecondaryServiceA;
module.exports.b = BatterySecondaryServiceB;