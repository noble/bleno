/********************************************/
/***************** HELPERS ******************/
/********************************************/
const ln = function() { // return exec's line when possible
	var e = new Error();
	if (!e.stack) try {
		// IE requires the Error to actually be throw or else the Error's 'stack'
		// property is undefined.
		throw e;
	} catch (e) {
		if (!e.stack) {
			return 0; // IE < 10, likely
		}
	}
	var stack = e.stack.toString().split(/\r\n|\n/);
	// We want our caller's frame. It's index into |stack| depends on the
	// browser and browser version, so we need to search for the second frame:
	var frameRE = /:(\d+):(?:\d+)[^\d]*$/;
	do {
		var frame = stack.shift();
	} while (!frameRE.exec(frame) && stack.length);
	return frameRE.exec(stack.shift())[1];
};
const uniqid = function(len) { // to create ... well, uniqid
	len = (typeof len === 'undefined' ? 8 : len);
    var chars = "123456789ABCDEFGHIJKLMNPQRSTUVWXTZabcdefghiklmnpqrstuvwxyz";
    var string_length = 10;
    var randomstring = '';

    for (var x=0;x<string_length;x++) {

        var letterOrNumber = Math.floor(Math.random() * 2);
        if (letterOrNumber == 0) {
            var newNum = Math.floor(Math.random() * 9);
            randomstring += newNum;
        } else {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum,rnum+1);
        }

    }
    return (randomstring);
};
const log = function(ln, ...args){ // more stuff when logging, using log(ln(), whatever)
	var pref = 'app.js ['+(new Date().toLocaleString('fr-FR'))+'] ';
	var str = 'line '+
		ln+
		' : '+log.caller.name+
		(args.length > 0
			? '() -> '+JSON.stringify(args)
			: '()'
		);
	console.log(pref+str);
	if (typeof pingPong != 'undefined' && pingPong.view) {
		pingPong.view.append(str+'<br>');
	}
};
/********************************************/
/***************** pingPong *****************/
/********************************************/
/***                                      ***/
/***   I tried to use this as much as i   ***/
/***   can so you can rename pingPong     ***/
/***   without any problem                ***/
/***                                      ***/
/********************************************/
var pingPong = {
	/********************************************/
	/***************** VARS *********************/
	/********************************************/
	view:null,
	/********************************************/
	/***************** TRIGGER ******************/
	/********************************************/
	trigger:{
		/**
		 * BT is On ?
		 * true -> then search + connect
		 * false -> ask for bt, repeat
		 */
		lookForDevice:function(){
			log(ln());
			var _this = this;
			// when a device is found
			var deviceFound = function(ph){
				log(ln());
				if (ph.name == "ping-pong") {
					log(ln(), 'ping-pong device found');
					log(ln(), 'stopScan');
					evothings.ble.stopScan();
					// keeping ph in object
					log(ln(), 'connecting ...');
					_this.Parent.ph = ph;
					// evothings.ble.connectToDevice(ph, onConnection, onDisconnect, onError);
					evothings.ble.connectToDevice(
						_this.Parent.ph,
						function(){
							log(ln(), 'connected, checking service & characteristic');

							_this.Parent.service = evothings.ble.getService(_this.Parent.ph, "0000ec00-0000-1000-8000-00805f9b34fb");
							if (!_this.Parent.service) {
								log(ln(), 'can\'t get service');
								// disconnecting
								evothings.ble.close(_this.Parent.ph);
								_this.Parent.failure();
							}
							_this.Parent.characteristic = evothings.ble.getCharacteristic(_this.Parent.service, "0000ec1e-0000-1000-8000-00805f9b34fb")
							if (!_this.Parent.characteristic) {
								log(ln(), 'can\'t get characteristic');
								// disconnecting
								evothings.ble.close(_this.Parent.ph);
								_this.Parent.failure();
							}

							_this.Parent.view.unbind('click');
							_this.Parent.view.click(function(){
								_this.readRequest();
							});
							log(ln(), 'everything is OK, tap for readRequest');
						},
						function(){
							log(ln(), 'disconnected, restarting ...');
							_this.lookForDevice();
						},
						function(err){
							log(ln(), 'connection error', err);
							_this.Parent.failure();
						}
					);
				} else {
					log(ln(), 'not our device : ', ph);
				}
			};
			// check if bt is on
			var btIsOn = function(){
				log(ln());
				// don't lookForDevice if app is in background
				if (!_this.Parent.settings.pause) {
					log(ln(), "startScan");
					// evothings.ble.startScan(deviceFound, err)
					// you can search directly with uuid
					evothings.ble.startScan(deviceFound, function(){
						_this.Parent.failure();
					});
					// @TODO think about proper clean this timeout when device has been found
					setTimeout(function(){
						log(ln(), "10s, stopScan");
						evothings.ble.stopScan();
					}, 10000);
				} else {
					log(ln(), 'don\'t lookForDevice if app is in background');
				}
			};
			var btIsOff = function(){
				log(ln());
				// don't ask enableBT if app is in background
				if (!_this.Parent.settings.pause) {
					// ask for bt, than callback
					_this.enableBT(function(){
						_this.lookForDevice();
					});
				} else {
					log(ln(), 'don\'t ask enableBT if app is in background');
				}
			};
			log(ln(), 'is BT enabled ?');
			bluetoothSerial.isEnabled(btIsOn, btIsOff);
		},
		enableBT:function(callback){
			log(ln());
			var _this = this;
			bluetoothSerial.enable(callback, function(){
				_this.Parent.failure();
			});
		},
		readRequest:function(){
			log(ln());
			var _this = this;
			// evothings.ble.readCharacteristic(ph, characteristic, onSuccess, onError);
			evothings.ble.readCharacteristic(this.Parent.ph, this.Parent.characteristic, function(response){
				// using evothings.ble.fromUtf8 because we know data is sent as string
				response = JSON.parse(evothings.ble.fromUtf8(response));
				log(ln(), "response = ", response.response);
				_this.Parent.view.unbind('click');
				_this.Parent.view.click(function(){
					_this.writeRequest(response.response == "pong" ? "ping": "pong");
				});
				log(ln(), 'tap for writeRequest \''+(response.response == "pong" ? "ping": "pong")+'\'');
			}, function(err){
				log(ln(), "readCharacteristic failed : ", err);
				_this.Parent.failure();
			});
		},
		writeRequest:function(str){
			log(ln());
			var _this = this;
			// building new value, obj as string using evothings.ble.toUtf8()
			var new_val = evothings.ble.toUtf8(JSON.stringify({
				'response': str
			}));
			evothings.ble.writeCharacteristic(this.Parent.ph, this.Parent.characteristic, new_val, function(){
				_this.Parent.view.unbind('click');
				_this.Parent.view.click(function(){
					_this.readRequest();
				});
				log(ln(), 'tap for readRequest, should be  \''+str+'\'');
			}, function(err){
				log(ln(), "writeCharacteristic failed : ", err);
				_this.Parent.failure();
			});
		}
	},
	/********************************************/
	/***************** RENDER *******************/
	/********************************************/
	render:{
		clear:function(){
			log(ln(), 'render');
			this.Parent.view.html('');
		}
	},
	settings:{
		pause:false
	},
	/********************************************/
	/***************** INIT *********************/
	/********************************************/
	init:function(){
		log(ln());
		// so this is accessible in little functions
		var _this = this;
		this.trigger.Parent = this;
		this.render.Parent = this;
		this.settings.Parent = this;

		this.view = $('#main');
		$('.fixed-action-btn > a').unbind('click');
		$('.fixed-action-btn > a').click(function(){
			log(ln(), 'reset clicked');
			_this.init();
		});
		this.render.clear();

		this.trigger.lookForDevice();
	},
	failure:function(){
		log(ln());
		if (!this.settings.pause) {
			Materialize.toast('L\'application à rencontré une erreur, réinitialisation', 3000, 'orange-text');
		}
		if (this.ph) {
			evothings.ble.close(this.ph);
		}
		this.init();
	}
};

document.addEventListener(
	'deviceready',
	function() {
		evothings.scriptsLoaded(function(){
			pingPong.init()
		});
	},
	false
);
// when app goes to background
document.addEventListener('pause', function() {
	pingPong.trigger.appPause();
});
// when app goes to foreground
document.addEventListener('resume', function() {
	pingPong.trigger.appResume();
});
