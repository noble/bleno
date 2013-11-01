var debug = require('debug')('descriptor');

function Descriptor(options) {
  this.uuid = options.uuid;
  this.value = options.value;
}

Descriptor.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    value: this.value
  });
};

module.exports = Descriptor;
