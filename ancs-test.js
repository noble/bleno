var util = require('util');

var bleno = require('./index');

var noble = require('noble');
var ANCS = require('ancs');

console.log('bleno');

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising('ancs-test', ['7905f431b5ce4e99a40f4b1e122d00d0']);
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    bleno.setServices([]);
  }
});

noble.on('discover', function(peripheral) {
  var ancs = new ANCS(peripheral);

  console.log('connected');
  ancs.discoverServicesAndCharacteristics(function() {
    console.log('services and characteristics discovered');
  });

  ancs.on('notification', function(notification) {
    console.log('notification: ' + notification);

    if (notification.event !== 'removed') {
      // notification.readAppIdentifier(function(appIdentifier) {
      //   console.log('\tappIdentifier = ' + appIdentifier);
      // });

      // notification.readTitle(function(title) {
      //   console.log('\ttitle = ' + title);
      // });

      // notification.readSubtitle(function(subtitle) {
      //   console.log('\tsubtitle = ' + subtitle);
      // });

      // notification.readMessage(function(message) {
      //   console.log('\tmessage = ' + message);
      // });

      // notification.readDate(function(date) {
      //   console.log('\tdate = ' + date);
      // });

      notification.readAttributes(function(attributes) {
        console.log(attributes);
      });
    }
  });
});
