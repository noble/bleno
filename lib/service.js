var debug = require('debug')('service');

function Service(options) {
  this.uuid = options.uuid;
  this.isPrimary = ('isPrimary' in options) ? options.isPrimary : true;
  this.includedServices = options.includedServices || [];
  this.characteristics = options.characteristics || [];
}

Service.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    isPrimary: this.isPrimary,
    includedServices: this.includedServices,
    characteristics: this.characteristics
  });
};

module.exports = Service;
