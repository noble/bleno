var express = require('express');
var app = express();
var path = require('path');

/* Express stuff */
// jade templates
app.set('views', path.join(__dirname));
app.set('view engine', 'jade');

// public files
app.use(express.static(path.join(__dirname)));

/* Copied from peripheral.js */
var util = require('util');

var bleno = require('../../..');
var pizza = require('../pizza');
var PizzaService = require('../pizza-service');

const name = 'PizzaSquat'; // advertized name

var pizzaService = new PizzaService(new pizza.Pizza());

bleno.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    bleno.startAdvertising(name, [pizzaService.uuid], function(err) {
      if (err) {
        console.log(err);
      }
    });
  }
  else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function(err) {
  if (!err) {
    console.log('advertising...');
    bleno.setServices([
      pizzaService
    ]);
  }
});

var serviceUuids = [pizzaService.uuid];	
var serviceNames = [name];
var characteristicUuids = pizzaService.characteristics.map((characteristic)=>characteristic.uuid);
var characteristicNames = ['crust', 'toppings', 'bake'];
var vals = {};
['PizzaToppings', 'PizzaCrust', 'PizzaBakeResult'].forEach(function(key) {
  vals[key] = pizza[key];
});

app.get('/', function (req, res) {
  res.render('index', {
    services: serviceUuids,
    characteristics: characteristicUuids,
    serviceNames: serviceNames,
    characteristicNames: characteristicNames,
    name: name,
    vals: vals
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
