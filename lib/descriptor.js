var debug = require('debug')('descriptor');

var UuidUtil = require('./uuid-util');

function Descriptor(options) {
  this.uuid = UuidUtil.removeDashes(options.uuid);
  this.value = options.value || new Buffer(0);
}

Descriptor.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    value: Buffer.isBuffer(this.value) ? this.value.toString('hex') : this.value
  });
};

module.exports = Descriptor;
