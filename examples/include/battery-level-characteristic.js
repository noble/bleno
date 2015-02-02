	var util = require('util'),
		bleno = require('bleno'),
		Descriptor = bleno.Descriptor,
		Characteristic = bleno.Characteristic;

	var BatteryLevelCharacteristic = function() {
		BatteryLevelCharacteristic.super_.call(this, {
			relativeHandle: '03',
			relativeValueHandle: '03',
			uuid: '2A19',
			properties: ['read','write','writeWithoutResponse','notify'],
			descriptors: [
				new Descriptor({
					relativeHandle: '03',
					uuid: '2901',
					value: 'Battery level between 0 and 100 percent. A very long description'
				}),
				new Descriptor({
					relativeHandle: '04',
					uuid: '2904',
					value: new Buffer([0x04, 0x01, 0x27, 0xAD, 0x01, 0x00, 0x00]) // maybe 12 0xC unsigned 8 bit
				})
			]
		});
	};

	util.inherits(BatteryLevelCharacteristic, Characteristic);

	var battery = new Buffer([98]);

	BatteryLevelCharacteristic.prototype.onReadRequest = function(offset, callback) {
		console.log('Got read',battery);

		callback(this.RESULT_SUCCESS, battery);
	};

	BatteryLevelCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
		console.log('Got write',data,data.length,offset,withoutResponse);

		if (offset !== 0) {
			callback(this.RESULT_INVALID_OFFSET);
			return
		}
		
		if (data.length > 20) {
			callback(this.RESULT_INVALID_ATTRIBUTE_LENGTH);
			return
		}		
		battery=new Buffer(data);
		
		callback(this.RESULT_SUCCESS);
	};

	BatteryLevelCharacteristic.prototype.updateValueCallback=null;

	BatteryLevelCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
		console.log('Got Subscribe',maxValueSize);
		this.updateValueCallback = updateValueCallback;
	};

	BatteryLevelCharacteristic.prototype.onUnsubscribe = function() {
		console.log('Got Unsubscribe');
		this.updateValueCallback = null;
	};

	BatteryLevelCharacteristic.prototype.onNotify = function() {
		console.log('Got Notify');
	};

	module.exports = BatteryLevelCharacteristic;
