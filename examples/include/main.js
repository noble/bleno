Object.prototype.isDefined = function(first_argument) {
	if (typeof first_argument === 'undefined' || first_argument === null) {
		return false;
	}
	return true;
};

var bleno = require('bleno'),
	BatteryService = require('./battery-service'),
	BatterySecondaryService = require('./battery-secondary-service');

var primaryService = new BatteryService();
var secondaryServiceA = new BatterySecondaryService.a();
var secondaryServiceB = new BatterySecondaryService.b();

bleno.on('stateChange', function(state) {
	console.log('on -> stateChange: ' + state);
	if (state === 'poweredOn') {
		bleno.startAdvertising('Battery', [primaryService.uuid]);
	} else {
		bleno.stopAdvertising();
	}
});

bleno.on('advertisingStart', function(error) {
	console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));
	if (!error) {
		bleno.setServices([primaryService, secondaryServiceA, secondaryServiceB]);
	}
});

//-----------------------------

var express = require('express');
var app = express();

app.get('/node/:node/value/:value', function (req, res) {
  var node = parseInt(req.params.node);
  var value =parseInt(req.params.value);

  if ({}.isDefined(primaryService.characteristics[node])) { 
  	if ( {}.isDefined(primaryService.characteristics[node].updateValueCallback)) {
  		primaryService.characteristics[node].updateValueCallback(new Buffer([value]));
  	}
    res.end();
  }else{
  	res.status(404).end();
  }
});

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

})

//-----------------------------


var attService = [
	{'0001': {attType:'2800',attValue:['1800']}}, //0x0001 «Primary Service» «GAP Service»
	{'0004': {attType:'2803',attValue:['02','0006','2A00']}}, //0x0004 «Characteristic» {0x02, 0x0006, «Device Name»}
	{'0006': {attType:'2A00',attValue:'Example Device'}}, //0x0006 «Device Name» “Example Device”
	
	{'0010': {attType:'2800',attValue:['1801']}}, //0x0010 «Primary Service» «GATT Service»
	{'0011': {attType:'2803',attValue:['02','0012','2A05']}}, //0x0011 «Characteristic» {0x02, 0x0012, «Service Changed»}
	{'0012': {attType:'2A05',attValue:['00000']}}, //0x0012 «Service Changed» 0x01FF

	{'0100': {attType:'2800',attValue:['180F']}}, //0x0100 «Primary Service» «Battery State Service»
	{'0106': {attType:'2803',attValue:['02','0110','2A19']}}, //0x0106 «Characteristic» {0x02, 0x0110, «Battery State»}
	{'0110': {attType:'2A19',attValue:['04']}}, //0x0110 «Battery State» 0x04

    {'0200': {attType:'2800',attValue:['181A']}}, //Environmental Sensing, 0x0200 «Primary Service» «Thermometer Humidity Service»
    {'0201': {attType:'2802',attValue:['0500','0504','180A']}},//Device Information 0x0201 «Include» {0x0500, 0x0504, «Manufacturer Service»}
    {'0202': {attType:'2802',attValue:['0550','0568']}},//0x0202 «Include» {0x0550,0x0568}
	{'0203': {attType:'2803',attValue:['02','0204','2A6E']}}, //0x0203 «Characteristic» {0x02, 0x0203, «Temperature»}
	{'0204': {attType:'2A6E',attValue:['028A']}}, //0x0204 «Temperature» 0x028A
    {'0205': {attType:'2904',attValue:['0E','FE','272F','01','010C']}},//0x0205 «Characteristic Format» {0x0E, 0xFE, «Celsius», 0x01, «Outside»}
    {'0206': {attType:'2901',attValue: 'Outside Temperature' }},//0x0206 «Characteristic UserDescription» “Outside Temperature”

    {'0210': {attType:'2803',attValue:['02','0212','2A6F']}}, //0x0210 «Characteristic» {0x02, 0x0212, «Relative Humidity»}
	{'0212': {attType:'2A6F',attValue:['27']}}, //0x0212 «Relative Humidity» 0x27
    {'0205': {attType:'2904',attValue:['04','00','27AD','01','010C']}},//0x0213 «Characteristic Format» {0x04, 0x00, «Percent», «Bluetooth SIG»,«Outside»}
    {'0206': {attType:'2901',attValue: 'Outside Relative Humidity' }},//0x0214 «Characteristic UserDescription» “Outside Relative Humidity”

	{'0280': {attType:'2800',attValue:['181D']}}, //0x0280 «Primary Service» «Weight Service» 181D
    {'0281': {attType:'2802',attValue:['0505','0509','180A']}},//0x0281 «Include» 0x0505, 0x0509, «Manufacturer Service»}
	{'0282': {attType:'2803',attValue:['02','0283','2A9D']}}, //0x0282 «Characteristic» {0x02, 0x0283, «Weight Kg»} 2A9D
	{'0283': {attType:'2A9D',attValue:['00005582']}}, //0x0283 «Weight Kg» 0x00005582

	{'0300': {attType:'2800',attValue:['1819']}}, //0x030 «Primary Service» «Position Service» 1819
    {'0301': {attType:'2803',attValue:['02','0302','2A67']}},//0x0301 «Characteristic» «Location and Speed Characteristic»
	{'0302': {attType:'2A67',attValue:['0C', '28BEAFA4', '0B320FCE', '000176']}}, //0x0302 «Characteristic» {mask, longitude, lattitude, elevation} 2A67

	{'0400': {attType:'2800',attValue:['1802']}}, //Immediate Alert, 0x0400 «Primary Service» «Alert Service» 1802
	{'0401': {attType:'2803',attValue:['02','0402','2A06']}}, //0x0401 «Characteristic» {0x0E, 0x0402, «Alert Enumeration»}
	{'0402': {attType:'2A06',attValue:['00']}}, //0x0402 «Alert Enumeration» 0x00

	{'0500': {attType:'2801',attValue:['180A']}}, //0x0500 «Secondary Service» «Manufacturer Service» 180A
	{'0501': {attType:'2803',attValue:['02','0502','2A29']}}, //0x0501 «Characteristic» {0x02, 0x0502, «Manufacturer Name»} 2A29
	{'0502': {attType:'2A29',attValue:'ACME Temperature Sensor'}}, //0x0502 «Manufacturer Name» “ACME Temperature Sensor”
	{'0503': {attType:'2803',attValue:['02','0504','2A25']}}, //0x0503 «Characteristic» {0x02, 0x0504, «Serial Number»}
	{'0504': {attType:'2A25',attValue:'237495-3282-A'}}, //0x0504 «Serial Number» “237495-3282-A”

	{'0505': {attType:'2801',attValue:['180A']}}, //0x0505 «Secondary Service» «Manufacturer Service» 180A
	{'0506': {attType:'2803',attValue:['02','0507','2A29']}}, //0x0506 «Characteristic» {0x02, 0x0507, «Manufacturer Name»} 2A29
	{'0507': {attType:'2A29',attValue:'ACME Weighing Scales'}}, //0x0507 «Manufacturer Name» “ACME Weighing Scales”
	{'0508': {attType:'2803',attValue:['02','0509','2A25']}}, //0x0508 «Characteristic» {0x02, 0x0509, «Serial Number»} 2A25
	{'0509': {attType:'2A25',attValue:'11267-2327A00239'}}, //0x0509 «Serial Number» “11267-2327A00239”

	{'0550': {attType:'2800',attValue:['feee74dca8de31961149d43596c00a4f']}}, //0x0550 «Secondary Service» «Vendor Specific Service» feee74dca8de31961149d43596c00a4f 
	{'0560': {attType:'2803',attValue:['02','0568','e9258c1e8962c4b60b452c9018f28880']}}, //0x0560 «Characteristic» {0x02, 0x0568, «Vendor Specific Type»} e9258c1e8962c4b60b452c9018f28880 
	{'0568': {attType:'e9258c1e8962c4b60b452c9018f28880',attValue:['56656E646F72']}} //0x0568 «Vendor Specific Type» 0x56656E646F72
	
	];
/*
for(var i=0;i < attService.length; i++){
	var attVal = attService[i];
	if (typeof attVal.attValue === 'string'){
		attVal.buffer = new Buffer(attVal.attValue);
	}else{
		//so array
		var len=0;
		for(var j=0;j<attVal.attValue.length;j++){
			len += attVal.attValue[j].length;
		}
	    console.debug('len=',len,'attVal.attValue=',attVal.attValue);
	}
}*/
