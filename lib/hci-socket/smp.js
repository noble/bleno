var debug = require('debug')('smp');

var events = require('events');
var util = require('util');

var crypto = require('./crypto');
var mgmt = require('./mgmt');

var SMP_CID = 0x0006;

var SMP_PAIRING_REQUEST = 0x01;
var SMP_PAIRING_RESPONSE = 0x02;
var SMP_PAIRING_CONFIRM = 0x03;
var SMP_PAIRING_RANDOM = 0x04;
var SMP_PAIRING_FAILED = 0x05;
var SMP_ENCRYPT_INFO = 0x06;
var SMP_MASTER_IDENT = 0x07;

var SMP_UNSPECIFIED = 0x08;

var Smp = function(aclStream, localAddressType, localAddress, remoteAddressType, remoteAddress) {
  this._aclStream = aclStream;

  this._iat = Buffer.from([(remoteAddressType === 'random') ? 0x01 : 0x00]);
  this._ia = Buffer.from(remoteAddress.split(':').reverse().join(''), 'hex');
  this._rat = Buffer.from([(localAddressType === 'random') ? 0x01 : 0x00]);
  this._ra = Buffer.from(localAddress.split(':').reverse().join(''), 'hex');

  this._stk = null;
  this._random = null;
  this._diversifier = null;

  this.onAclStreamDataBinded = this.onAclStreamData.bind(this);
  this.onAclStreamEncryptChangeBinded = this.onAclStreamEncryptChange.bind(this);
  this.onAclStreamLtkNegReplyBinded = this.onAclStreamLtkNegReply.bind(this);
  this.onAclStreamEndBinded = this.onAclStreamEnd.bind(this);

  this._aclStream.on('data', this.onAclStreamDataBinded);
  this._aclStream.on('encryptChange', this.onAclStreamEncryptChangeBinded);
  this._aclStream.on('ltkNegReply', this.onAclStreamLtkNegReplyBinded);
  this._aclStream.on('end', this.onAclStreamEndBinded);
};

util.inherits(Smp, events.EventEmitter);

Smp.prototype.onAclStreamData = function(cid, data) {
  if (cid !== SMP_CID) {
    return;
  }

  var code = data.readUInt8(0);

  if (SMP_PAIRING_REQUEST === code) {
    this.handlePairingRequest(data);
  } else if (SMP_PAIRING_CONFIRM === code) {
    this.handlePairingConfirm(data);
  } else if (SMP_PAIRING_RANDOM === code) {
    this.handlePairingRandom(data);
  } else if (SMP_PAIRING_FAILED === code) {
    this.handlePairingFailed(data);
  }
};

Smp.prototype.onAclStreamEncryptChange = function(encrypted) {
  if (encrypted) {
    if (this._stk && this._diversifier && this._random) {
      this.write(Buffer.concat([
        Buffer.from([SMP_ENCRYPT_INFO]),
        this._stk
      ]));

      this.write(Buffer.concat([
        Buffer.from([SMP_MASTER_IDENT]),
        this._diversifier,
        this._random
      ]));
    }
  }
};

Smp.prototype.onAclStreamLtkNegReply = function() {
    this.write(Buffer.from([
      SMP_PAIRING_FAILED,
      SMP_UNSPECIFIED
    ]));

    this.emit('fail');
};

Smp.prototype.onAclStreamEnd = function() {
  this._aclStream.removeListener('data', this.onAclStreamDataBinded);
  this._aclStream.removeListener('encryptChange', this.onAclStreamEncryptChangeBinded);
  this._aclStream.removeListener('ltkNegReply', this.onAclStreamLtkNegReplyBinded);
  this._aclStream.removeListener('end', this.onAclStreamEndBinded);
};

Smp.prototype.handlePairingRequest = function(data) {
  this._preq = data;

  this._pres = Buffer.from([
    SMP_PAIRING_RESPONSE,
    0x03, // IO capability: NoInputNoOutput
    0x00, // OOB data: Authentication data not present
    0x01, // Authentication requirement: Bonding - No MITM
    0x10, // Max encryption key size
    0x00, // Initiator key distribution: <none>
    0x01  // Responder key distribution: EncKey
  ]);

  this.write(this._pres);
};

Smp.prototype.handlePairingConfirm = function(data) {
  this._pcnf = data;

  this._tk = Buffer.from('00000000000000000000000000000000', 'hex');
  this._r = crypto.r();

  this.write(Buffer.concat([
    Buffer.from([SMP_PAIRING_CONFIRM]),
    crypto.c1(this._tk, this._r, this._pres, this._preq, this._iat, this._ia, this._rat, this._ra)
  ]));
};

Smp.prototype.handlePairingRandom = function(data) {
  var r = data.slice(1);

  var pcnf = Buffer.concat([
    Buffer.from([SMP_PAIRING_CONFIRM]),
    crypto.c1(this._tk, r, this._pres, this._preq, this._iat, this._ia, this._rat, this._ra)
  ]);

  if (this._pcnf.toString('hex') === pcnf.toString('hex')) {
    this._diversifier = Buffer.from('0000', 'hex');
    this._random = Buffer.from('0000000000000000', 'hex');
    this._stk = crypto.s1(this._tk, this._r, r);

    mgmt.addLongTermKey(this._ia, this._iat, 0, 0, this._diversifier, this._random, this._stk);

    this.write(Buffer.concat([
      Buffer.from([SMP_PAIRING_RANDOM]),
      this._r
    ]));
  } else {
    this.write(Buffer.from([
      SMP_PAIRING_FAILED,
      SMP_PAIRING_CONFIRM
    ]));

    this.emit('fail');
  }
};

Smp.prototype.handlePairingFailed = function(data) {
  this.emit('fail');
};

Smp.prototype.write = function(data) {
  this._aclStream.write(SMP_CID, data);
};

module.exports = Smp;
