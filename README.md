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

 __Note:__: adveristing params are limited 22 - 28 bytes, some maximums combination examples:

  * 28 byte name
  * 1 128-bit service UUID + 9 byte name
  * 1 128-bit service UUID + 1 16-bit service UUID's
  * 7 16-bit service UUID


Start advertising iBeacon:
    
    var uuid = 'e2c56db5dffb48d2b060d0f5a71096e0';
    var major = 0; // 0x0000 - 0xffff
    var minor = 0; // 0x0000 - 0xffff
    var measuredPower = -59; // -128 - 127

    bleno.startAdvertisingIBeacon(uuid, major, minor, measuredPower[, callback(error)]);

 __Note:__: on OS X, in iBeacon mode your peripheral is non-connectable!

Stop advertising:

    bleno.stopAdvertising();

Set services:

    var services = [
       ... // see PrimaryService for data type
    ];

    bleno.setServices(services[, callback(error)]);

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
           * indicate (not possible)
           * secure
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
           * secure
               * read
               * write
         * ~~Descriptors~~
           * ~~UUID~~
           * ~~read (static)~~
           * write (maybe ?)
      * Included Services (maybe ?)
   * error handling
 * Windows
   * TDB (most likely Windows 8 only)

   
License
========

Copyright (C) 2013 Sandeep Mistry <sandeep.mistry@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
