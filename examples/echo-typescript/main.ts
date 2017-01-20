import * as Bleno from '../..';
import { PrimaryService } from '../..';
import { EchoCharacteristic } from './characteristic';

console.log('bleno - echo with TypeScript');


Bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    Bleno.startAdvertising('echo', ['ec00']);
  } else {
    Bleno.stopAdvertising();
  }
});

let characteristic = new EchoCharacteristic();
Bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    Bleno.setServices([
      new PrimaryService({
        uuid: 'ec00',
        characteristics: [ characteristic ]
      })
    ]);
  }
});
