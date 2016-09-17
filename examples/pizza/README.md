# BLE Pizza Service

This is an example program demonstrating BLE connectivity between a peripheral running bleno, and a central running noble.

The service represents a robotic pizza oven, with the following characteristics:

* crust - read / write. A value representing the type of pizza crust (normal, thin, or deep dish)
* toppings - read / write. A value representing which toppings to include (pepperoni, mushrooms, extra cheese, etc.)
* bake - write / notify. The value written is the temperature at which to bake the pizza. When baking is finished, the central is notified with a bake result (half baked, crispy, burnt, etc.)

To run the peripheral example:

    node peripheral

And on another computer, connect as a central from [noble](https://github.com/sandeepmistry/noble/tree/master/examples/pizza).
You can also use a [web app](http://strangesast.github.io/bleno-web-pizza-example) using [Web Bluetooth](https://developers.google.com/web/updates/2015/07/interact-with-ble-devices-on-the-web).
