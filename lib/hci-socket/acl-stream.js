var debug = require('debug')('acl-att-stream');

var events = require('events');
var util = require('util');

var crypto = require('./crypto');
var Smp = require('./smp');

var AclStream = function(hci, handle, localAddressType, localAddress, remoteAddressType, remoteAddress) {
  this._hci = hci;
  this._handle = handle;
  this.encypted = false;

  this._smp = new Smp(this, localAddressType, localAddress, remoteAddressType, remoteAddress);
};

util.inherits(AclStream, events.EventEmitter);


AclStream.prototype.write = function(cid, data) {
  this._hci.queueAclDataPkt(this._handle, cid, data);
};

AclStream.prototype.push = function(cid, data) {
  if (data) {
    this.emit('data', cid, data);
  } else {
    this.emit('end');
  }
};

AclStream.prototype.pushEncrypt = function(encrypt) {
  this.encrypted = encrypt ? true : false;

  this.emit('encryptChange', this.encrypted);
};

AclStream.prototype.pushLtkNegReply = function() {
  this.emit('ltkNegReply');
};

module.exports = AclStream;
