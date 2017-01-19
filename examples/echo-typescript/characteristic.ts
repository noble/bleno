import { Characteristic } from '../..';

export class EchoCharacteristic extends Characteristic {
  _value: any;
  _updateValueCallback: any;

  constructor() {
    super({
      uuid: 'ec0e',
      properties: ['read', 'write', 'notify'],
      value: null
    });
    this._value = new ArrayBuffer(0);
    this._updateValueCallback = null;
  }

  onReadRequest(offset, callback) {
    console.log('EchoCharacteristic - onReadRequest: value = ' + this._value.toString('hex'));

    callback(Characteristic.RESULT_SUCCESS, this._value);
  }

  onWriteRequest(data, offset, withoutResponse, callback) {
    this._value = data;

    console.log('EchoCharacteristic - onWriteRequest: value = ' + this._value.toString('hex'));

    if (this._updateValueCallback) {
      console.log('EchoCharacteristic - onWriteRequest: notifying');

      this._updateValueCallback(this._value);
    }

    callback(Characteristic.RESULT_SUCCESS);
  }

  onSubscribe(maxValueSize, updateValueCallback) {
    console.log('EchoCharacteristic - onSubscribe');

    this._updateValueCallback = updateValueCallback;
  }

  onUnsubscribefunction() {
    console.log('EchoCharacteristic - onUnsubscribe');

    this._updateValueCallback = null;
  }
}
