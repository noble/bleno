var util = require('util');

var bleno = require('./index');

var noble = require('noble');
var ANCS = require('ancs');

console.log('bleno');

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    if (bleno.startAdvertisingWithEIRData) {
      var ad = new Buffer([
        // flags
        0x02, 0x01, 0x02,

        // ANCS solicitation
        0x11, 0x15, 0xd0, 0x00, 0x2D, 0x12, 0x1E, 0x4B, 0x0F,
        0xA4, 0x99, 0x4E, 0xCE, 0xB5, 0x31, 0xF4, 0x05, 0x79
      ]);

      var scan = new Buffer([0x05, 0x08, 0x74, 0x65, 0x73, 0x74]); // name

      bleno.startAdvertisingWithEIRData(ad, scan);
    } else {
      bleno.startAdvertising('ancs-test', ['7905f431b5ce4e99a40f4b1e122d00d0']);
    }

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

  ancs.connect(function() {
    console.log('ancs - connected');

    ancs.on('disconnect', function() {
      console.log('ancs - disconnected');
      ancs.removeAllListeners();
      ancs = null;
    });

    ancs.discoverServicesAndCharacteristics(function() {
      console.log('ancs - services and characteristics discovered');
    });

    ancs.on('notification', function(notification) {
      console.log('ancs - notification: ' + notification);

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
});
