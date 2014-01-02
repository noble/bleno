bleno - [blink(1)](http://thingm.com/products/blink-1/) example
===============================================
This example allows you to control a [ThingM](http://thingm.com/) [blink(1)](http://thingm.com/products/blink-1/) via BLE.

It uses bleno and [node-blink1](https://github.com/sandeepmistry/node-blink1) and requires a blink(1) to be connected via USB.

See [main file](https://github.com/sandeepmistry/bleno/blob/master/examples/blink1/main.js) for entry point.

[Device Information service](https://github.com/sandeepmistry/bleno/blob/master/examples/blink1/device-information-service.js)
-----------------------------------

UUID: [0x180A](https://developer.bluetooth.org/gatt/services/Pages/ServiceViewer.aspx?u=org.bluetooth.service.device_information.xml)

__Characteristics:__

 * [Serial Number](https://github.com/sandeepmistry/bleno/blob/master/examples/blink1/serial-number-characteristic.js)
    * UUID: [0x2a25](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.serial_number_string.xml)
    * Properties: read
    * Description: read the blink(1)'s serial number

 * [Hardware Revision](https://github.com/sandeepmistry/bleno/blob/master/examples/blink1/hardware-revision-characteristic.js)
    * UUID: [0x2a27](https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.hardware_revision_string.xml)
    * Properties: read
    * Description: read the blink(1)'s version   

blink(1) service
--------------------
UUID: 0x01010101010101010101010101010101

__Characteristics:__

 * [RGB](https://github.com/sandeepmistry/bleno/blob/master/examples/blink1/blink1-rgb-characteristic.js)
    * UUID: 01010101010101010101010101524742
    * Properties: write, write without response
    * Description: Set the blink(1)'s color
        * Data format is: RRGGBB (3 bytes) - single byte for each color 
        
 * [Fade RGB](https://github.com/sandeepmistry/bleno/blob/master/examples/blink1/blink1-fade-rgb-characteristic.js)
    * UUID: 01010101010101010166616465524742
    *  Properties: write, write without response, notify
    *  Description: Fade the blink(1)'s color and notication when fade is complete
        * Data format is: TTTTRRGGBB (5 bytes)
            * TTTT -  fade time in milliseconds (Little Endian)
            * RRGGBB (3 bytes) - single byte for each color 
