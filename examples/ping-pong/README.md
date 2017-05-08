# PING PONG example

Using [evothings] and [bleno]

# Android app :

* Display what happens, with line :
  * ask if bt is enabled
    * enable bt if not already enable
    * search for bt device by name
  * auto connect to device
  * **repeat here** tap for readRequest (should get "pong")
  * tap for writeRequest (write "ping")
  * tap for readRequest (should get "ping")
  * tap for writeRequest (write "pong")
  * **repeat**

# RPi :

* Log every listener
* 1 service
* 1 characteristic


   [evothings]: <https://evothings.com/>
   [bleno]: <https://github.com/sandeepmistry/bleno>
