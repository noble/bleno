var util = require('util');
var bleno = require('../..');

var PizzaCrustCharacteristic = require('./pizza-crust-characteristic');
var PizzaToppingsCharacteristic = require('./pizza-toppings-characteristic');
var PizzaBakeCharacteristic = require('./pizza-bake-characteristic');

function PizzaService(pizza) {
    bleno.PrimaryService.call(this, {
        uuid: '13333333333333333333333333333337',
        characteristics: [
            new PizzaCrustCharacteristic(pizza),
            new PizzaToppingsCharacteristic(pizza),
            new PizzaBakeCharacteristic(pizza)
        ]
    });
}

util.inherits(PizzaService, bleno.PrimaryService);

module.exports = PizzaService;
