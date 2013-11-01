var debug = require('debug')('primary-service');

function PrimaryService(options) {
  this.uuid = options.uuid;
  this.includedServices = options.includedServices || [];
  this.characteristics = options.characteristics || [];
}

PrimaryService.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    includedServices: this.includedServices,
    characteristics: this.characteristics
  });
};

module.exports = PrimaryService;
