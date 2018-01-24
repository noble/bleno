var util = require('util');
var bleno = require('bleno');


/**
 * Simple read/write example
 */
var BlenoCharacteristic = bleno.Characteristic;

var pingPong = function() {
	pingPong.super_.call(this, {
		// change this !!! (on android, you have to disable/re-enable bluetooth to see changes)
		uuid: 'ec1e',
		// @TODO, another example using notify
		properties: ['read', 'write'],
		value: null
	});

	// so you can stock everything you want
	this._data = {
		'response' : "pong"
	};

	// actually sent as string, edit as you want
	// sent data must use buffer to be able to "talk" through bt
	this._buffer = new Buffer(JSON.stringify(this._data));
};

util.inherits(pingPong, BlenoCharacteristic);

// so "JSON.parse()'s throw" doesn't crash the whole app if you don't want to use try {} catch {}
pingPong.prototype.safelyParseJSON = function(json) {
	var parsed;
	try {
		parsed = JSON.parse(json)
	} catch (e) {
		// Oh well, but whatever...
	}
	return parsed; // Could be undefined!
};

pingPong.prototype.onReadRequest = function(offset, callback) {
	console.log('pingPong.onReadRequest');
	// do what you want with data
	// recreate buffer
	this._buffer = new Buffer(JSON.stringify(this._data));
	// this._buffer.slice() is needed
	callback(this.RESULT_SUCCESS, this._buffer.slice(offset, this._buffer.length));
};

pingPong.prototype.onWriteRequest = function(receipt, offset, withoutResponse, callback) {
	console.log('pingPong.onWriteRequest, receipt = '+receipt);
	// toString('utf8') !!!
	var receiptObj = this.safelyParseJSON(receipt.toString('utf8'));
	// check your data as you want
	if (typeof receiptObj == 'undefined' || typeof receiptObj.response == 'undefined') {
		console.log('pingPong.onWriteRequest, RESULT_UNLIKELY_ERROR');
		return callback(this.RESULT_UNLIKELY_ERROR);
	}
	// Do stuff with data
	this._data.response = receiptObj.response;
	// result success
	callback(this.RESULT_SUCCESS);
};

module.exports = pingPong;