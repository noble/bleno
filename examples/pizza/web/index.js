var crustSelectEl = document.getElementById('crust-type');
var toppingsEls = document.querySelectorAll('[name=toppings]');
var ovenTempEl = document.getElementById('oven-temperature');
var crustTypeEl = document.getElementById('crust-type');
var outputEl = document.getElementById('output');

// ¯\_(ツ)_/¯
function swap16(val) {
  // le to be
  return ((val & 0xFF) << 8)
    | ((val >> 8) & 0xFF);
}
const PizzaCrust = vals.PizzaCrust;
const PizzaToppings = vals.PizzaToppings;
const PizzaBakeResult = vals.PizzaBakeResult;

var cachedCharacteristics = {};

// current bluetooth connection obj
var ovenServer = null;

// connect to bluetooth peripheral
var readyOven = function() {
  return navigator.bluetooth.requestDevice({
    filters: [{services: serviceUuids}, {name: name}]
  }).then(function(device) {
    return device.gatt.connect();

  }).then(function(server) {
    ovenServer = server;
    return server.getPrimaryService(serviceUuids[0]);

  }).then(function(service) {
    return Promise.all(characteristicUuids.map((characteristic)=>service.getCharacteristic(characteristic)));

  }).then(function(characteristics) {
    characteristicNames.forEach(function(name, i) {
      cachedCharacteristics[name] = characteristics[i];
    });
    return cachedCharacteristics;

  }).catch(function(err) {
    alert('oven (bluetooth) error');
    throw err;
  });
};

// characteristic setup
var readyCrust = function(crustType) {
  console.log('crustType:', crustType);
  return function() {
    var crust = new Uint8Array(1);
    crust[0] = crustType;

    var pizzaCrustCharacteristic = cachedCharacteristics['crust'];
    if(pizzaCrustCharacteristic == null) throw new Error('oven not ready!');
    return pizzaCrustCharacteristic.writeValue(crust).catch(function(err) {
      alert('crust error');
      throw err;
    });
  }
};

var readyToppings = function(toppings) {
  console.log('toppings:', toppings);
  return function() {
    var toppingsBuff = new Uint8Array(2);
    toppingsBuff[0] = toppings.map((topping)=>PizzaToppings[topping]).concat(0).reduce((a, b)=>a | b);

    var pizzaToppingsCharacteristic = cachedCharacteristics['toppings'];
    if(pizzaToppingsCharacteristic == null) throw new Error('oven not ready');
    return pizzaToppingsCharacteristic.writeValue(toppingsBuff).catch(function(err) {
      alert('toppings error');
      throw err;
    });
  };
};

var bakePizza = function(temperature) {
  console.log('oven temp:', temperature);
  return function() {
    var pizzaBakeCharacteristic = cachedCharacteristics['bake'];
    if(pizzaBakeCharacteristic == null) throw new Error('oven not ready!');

    var tempBuff = new Uint16Array([swap16(temperature)]);
    return pizzaBakeCharacteristic.writeValue(tempBuff).then(function() {
      result = pizzaBakeCharacteristic.value.getUint8();
      log('The result is ' + (
        result == PizzaBakeResult.HALF_BAKED ? 'half baked.' :
        result == PizzaBakeResult.BAKED ? 'baked.' :
        result == PizzaBakeResult.CRISPY ? 'crispy.' :
        result == PizzaBakeResult.BURNT ? 'burnt.' :
        result == PizzaBakeResult.ON_FIRE ? 'on fire!' : 'unknown?'));

      return result;

    }).catch(function(err) {
      alert('bake error');
      throw err;
    });
  };
};

// get values from dom
var getCrustType = function() {
  return Number(crustSelectEl.value);
};

var getToppings = function() {
  var toppings = [];
  [].slice.call(toppingsEls).forEach(function(el) {
    if(el.checked) toppings.push(Number(el.value));
  });
  console.log(toppings);
  return ['EXTRA_CHEESE', 'CANADIAN_BACON', 'PINEAPPLE'];
  return toppings;
};

var getOvenTemperature = function() {
  return ovenTempEl.value;
};


// button listeners
var onStartButtonClick = function(e) {
  if(ovenServer != null && ovenServer.connected) alert('Already connected...');
  return readyOven().then(function() {
    alert('Connection successful!');
    console.log(ovenServer);
  });
};

var onBakeButtonClick = function(e) {
  if(ovenServer == null || !ovenServer.connected) alert('Not connected!');
  [
    readyCrust(getCrustType()),
    readyToppings(getToppings()),
    bakePizza(getOvenTemperature())
  ].reduce(function(a, b) {
    return a.then(b);
  }, Promise.resolve());
};

var log = function(text) {
  outputEl.textContent = text;
}
