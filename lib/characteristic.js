var debug = require('debug')('characteristic');

function Characteristic(options) {
  this.uuid = options.uuid;
  this.properties = options.properties || [];
  this.value = options.value;
  this.descriptors = options.descriptors || [];
}

Characteristic.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    properties: this.properties,
    value: this.value,
    descriptors: this.descriptors
  });
};

module.exports = Characteristic;
