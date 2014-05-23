bleno
=====

A node.js module for implementing BLE (Bluetooth low energy) peripherals.

Need a BLE central module? See [noble](https://github.com/sandeepmistry/noble).

__Note:__ Mac OS X and Linux are currently the only supported OSes, and are still under development. Other platforms will be developed later on (see Roadmap below).

Prerequisites
------------

__Linux (Ubuntu)__

 * ```sudo apt-get install libbluetooth-dev```
 * Run as ```sudo``` or ```root```

__OS X__

 * 10.9 or later

Install
-------

    npm install bleno

Usage
-----

    var bleno = require('bleno');

See [examples folder](https://github.com/sandeepmistry/bleno/blob/master/examples) for code examples.

__Actions__

Start advertising:

    var name = 'name';
    var serviceUuids = ['fffffffffffffffffffffffffffffff0']

    bleno.startAdvertising(name, serviceUuids[, callback(error)]);

 __Note:__: there are limits on the name and service UUID's

  * name
    * maximum 26 bytes
  * service UUID's
    * 1 128-bit service UUID
    * 1 128-bit service UUID + 2 16-bit service UUID's
    * 7 16-bit service UUID


Start advertising iBeacon:

    var uuid = 'e2c56db5dffb48d2b060d0f5a71096e0';
    var major = 0; // 0x0000 - 0xffff
    var minor = 0; // 0x0000 - 0xffff
    var measuredPower = -59; // -128 - 127

    bleno.startAdvertisingIBeacon(uuid, major, minor, measuredPower[, callback(error)]);

 __Note:__: on OS X, in iBeacon mode your peripheral is non-connectable!

Start advertising with EIR data (__Linux only__):

    var scanData = new Buffer(...); // maximum 31 bytes
    var advertisementData = new Buffer(...); // maximum 31 bytes

    bleno.startAdvertisingWithEIRData(advertisementData, scanData[, callback(error)]);

  * For EIR format section [Bluetooth Core Specification](https://www.bluetooth.org/docman/handlers/downloaddoc.ashx?doc_id=229737) sections and 8 and 18 for more information the data format.

Stop advertising:

    bleno.stopAdvertising([callback]);

Set services:

    var services = [
       ... // see PrimaryService for data type
    ];

    bleno.setServices(services[, callback(error)]);

Disconnect client:

    bleno.disconnect(); // Linux only

Update RSSI:

    bleno.updateRssi([callback(error, rssi)]); // Linux only

__Primary Service__

    var PrimaryService = bleno.PrimaryService;

    var primaryService = new PrimaryService({
        uuid: 'fffffffffffffffffffffffffffffff0', // or 'fff0' for 16-bit
        characteristics: [
            // see Characteristic for data type
        ]
    });

__Characteristic__

    var Characteristic = bleno.Characteristic;

    var characteristic = new Characteristic({
        uuid: 'fffffffffffffffffffffffffffffff1', // or 'fff1' for 16-bit
        properties: [ ... ], // can be a combination of 'read', 'write', 'writeWithoutResponse', 'notify'
        secure: [ ... ], // enable security for properties, can be a combination of 'read', 'write', 'writeWithoutResponse', 'notify'
        value: null, // optional static value, must be of type Buffer
        descriptors: [
            // see Descriptor for data type
        ],
        onReadRequest: null, // optional read request handler, function(offset, callback) { ... }
        onWriteRequest: null, // optional write request handler, function(data, offset, withoutResponse, callback) { ...}
        onSubscribe: null, // optional notify subscribe handler, function(maxValueSize, updateValueCallback) { ...}
        onUnsubscribe: null, // optional notify unsubscribe handler, function() { ...}
        onNotify: null // optional notify sent handler, function() { ...}
    });

Result codes:

  * Characteristic.RESULT_SUCCESS
  * Characteristic.RESULT_INVALID_OFFSET
  * Characteristic.RESULT_INVALID_ATTRIBUTE_LENGTH
  * Characteristic.RESULT_UNLIKELY_ERROR

Read requests:

Can specify read request handler via constructor options or by extending Characteristic and overriding onReadRequest.

Parameters to handler are
  * ```offset``` (0x0000 - 0xffff)
  * ```callback```


```callback``` must be called with result and data (of type ```Buffer```) - can be async.

    var result = Characteristic.RESULT_SUCCESS;
    var data = new Buffer( ... );

    callback(result, data);

Write requests:

Can specify write request handler via constructor options or by extending Characteristic and overriding onWriteRequest.

Parameters to handler are
  * ```data``` (Buffer)
  * ```offset``` (0x0000 - 0xffff)
  * ```withoutResponse``` (true | false)
  * ```callback```.

```callback``` must be called with result code - can be async.

    var result = Characteristic.RESULT_SUCCESS;

    callback(result);

Notify subscribe:

Can specify notify subscribe handler via constructor options or by extending Characteristic and overriding onSubscribe.

Parameters to handler are
  * ```maxValueSize``` (maximum data size)
  * ```updateValueCallback``` (callback to call when value has changed)

Notify unsubscribe:

Can specify notify unsubscribe handler via constructor options or by extending Characteristic and overriding onUnsubscribe.

Notify value changes:

Call the ```updateValueCallback``` callback (see Notify subcribe), with an argument of type ```Buffer```

Can specify notify sent handler via constructor options or by extending Characteristic and overriding onNotify.

__Descriptor__

    var Descriptor = bleno.Descriptor;

    var descriptor = new Descriptor({
        uuid: '2901',
        value: 'value' // static value, must be of type Buffer or string if set
    });

__Events__

Adapter state change:

    state = <"unknown" | "resetting" | "unsupported" | "unauthorized" | "poweredOff" | "poweredOn">

    bleno.on('stateChange', callback(state));

Advertisement started:

    bleno.on('advertisingStart', callback(error));

    bleno.on('advertisingStartError', callback(error));

Advertisement stopped:

    bleno.on('advertisingStop', callback);

Services set:

    bleno.on('servicesSet', callback);

Accept:

    bleno.on('accept', callback(clientAddress)); // Linux only

Disconnect:

    bleno.on('disconnect', callback(clientAddress)); // Linux only

RSSI Update:

    bleno.on('rssiUpdate', callback(rssi)); // Linux only

Running on Linux
-----------------
Must be run with ```sudo``` or as root user.

```hci0``` is used by default to override set the ```BLENO_HCI_DEVICE_ID``` environment variable to the interface number.

Example, specify ```hci1```:

    sudo BLENO_HCI_DEVICE_ID=1 node <your file>.js

Roadmap (TODO)
--------------

 * Mac OS X:
   * ~~Adapter state (unknown | reseting | unsupported | unauthorized | off | on)~~
   * ~~Advertisement~~
      * ~~startAdvertising~~
         * ~~name~~
         * ~~service UUID's~~
      * ~~startAdvertisingIBeacon~~
      * ~~stopAdvertising~~
   * ~~Services~~
      * ~~UUID~~
      * ~~Characteristics~~
         * ~~UUID~~
         * ~~properties~~
           * ~~read (static, dynamic)~~
           * ~~write~~
           * ~~write without response~~
           * ~~notify (subscribe, unsubscribe, value changed)~~
           * broadcast (not possible)
           * ~~indicate~~
           * secure (not functioning, OS X issues)
              * read
              * write
         * ~~Descriptors~~
           * ~~UUID~~
           * ~~read (static)~~
           * write (not possible)
      * Included Services (maybe ?)
   * error handling

 * Linux
   * ~~Adapter state (unsupported | unauthorized | off | on)~~
   * ~~Advertisement~~
      * ~~startAdvertising~~
         * ~~name~~
         * ~~service UUID's~~
      * ~~startAdvertisingIBeacon~~
      * ~~stopAdvertising~~
   * ~~Services~~
      * ~~UUID~~
      * ~~Characteristics~~
         * ~~UUID~~
         * ~~properties~~
           * ~~read (static, dynamic)~~
           * ~~write~~
           * ~~write without response~~
           * ~~notify (subscribe, unsubscribe, value changed)~~
           * broadcast (maybe ?)
           * indicate (maybe ?)
           * ~~secure~~
               * ~~read~~
               * ~~write~~
         * ~~Descriptors~~
           * ~~UUID~~
           * ~~read (static)~~
           * write (maybe ?)
      * Included Services (maybe ?)
   * error handling
 * Windows
   * TDB (most likely Windows 8 only)

Useful tools/links
==================

 * Tools
   * LightBlue for [iOS](https://itunes.apple.com/us/app/lightblue/id557428110)/[OS X](https://itunes.apple.com/us/app/lightblue/id639944780)
   * [nRF Master Control Panel (BLE)](https://play.google.com/store/apps/details?id=no.nordicsemi.android.mcp&hl=en) for Android
   * [hcitool](http://linux.die.net/man/1/hcitool) and ```gatttool``` by [BlueZ](http://www.bluez.org) for Linux



License
========

Copyright (C) 2013 Sandeep Mistry <sandeep.mistry@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
