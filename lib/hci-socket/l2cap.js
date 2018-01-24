var debug = require('debug')('l2cap');

var events = require('events');
var util = require('util');

var L2CAPStream = require('./l2cap-stream');

var LE_SIGNALING_CID = 0x0005;

var L2CAP_COMMAND_REJECT = 0x01;
var L2CAP_DISCONN_REQUEST = 0x06;
var L2CAP_DISCONN_RESPONSE = 0x07;
var L2CAP_CONN_PARAM_UPDATE_REQUEST = 0x12;
var L2CAP_CONN_PARAM_UPDATE_RESPONSE = 0x13;
var L2CAP_LE_CONN_REQUEST = 0x14;
var L2CAP_LE_CONN_RESPONSE = 0x15;
var L2CAP_LE_CREDITS = 0x16;

// PSM
var L2CAP_PSM_LE_DYN_START = 0x0080;
var L2CAP_PSM_LE_DYN_END = 0x00FF;

// Channel Identifier
var L2CAP_CID_DYN_START = 0x0040;
var L2CAP_CID_DYN_END = 0x007F;

var L2cap = function() {
  this._registeredPSMs = {};
  this._activeStreams = {};

  this.onAclStreamDataBinded = this.onAclStreamData.bind(this);
  this.onAclStreamEndBinded = this.onAclStreamEnd.bind(this);
};

util.inherits(L2cap, events.EventEmitter);

L2cap.prototype.publishL2CAPChannel = function(psm, callback) {
  if (psm < L2CAP_PSM_LE_DYN_START || psm > L2CAP_PSM_LE_DYN_END) {
    debug('invalid psm');
    if (callback) {
      callback(false, 'invalid psm');
    }
    return;
  }

  if (this._registeredPSMs[psm] !== undefined) {
    debug('psm already registered');
    if (callback) {
      callback(false, 'psm already registered');
    }
    return;
  }

  this._registeredPSMs[psm] = true;
  if (callback) {
    callback(true);
  }
};

L2cap.prototype.setAclStream = function(aclStream) {
  this._aclStream = aclStream;

  this._aclStream.on('data', this.onAclStreamDataBinded);
  this._aclStream.on('end', this.onAclStreamEndBinded);
};

L2cap.prototype.onAclStreamData = function(cid, data) {
  if (LE_SIGNALING_CID === cid) {
    this.handleSignaling(data);
    return;
  }

  if (cid >= L2CAP_CID_DYN_START && cid <= L2CAP_CID_DYN_END) {
    var stream = this._activeStreams[cid];
    if (stream) {
      stream.push(data);
    }
  }
};

L2cap.prototype.onAclStreamEnd = function() {
  this._aclStream.removeListener('data', this.onAclStreamDataBinded);
  this._aclStream.removeListener('end', this.onAclStreamEndBinded);

  Object.keys(this._activeStreams).forEach((key) => {
    var stream = this._activeStreams[key];
    stream.invalidate();
  });

  this._activeStreams = {};
};

L2cap.prototype.handleSignaling = function(data) {
  var code = data.readUInt8(0);

  if (L2CAP_COMMAND_REJECT === code) {
    this.handleCommandRejection(data);
  } else if (L2CAP_DISCONN_REQUEST === code) {
    this.handleDisconnectRequest(data);
  } else if (L2CAP_DISCONN_RESPONSE === code) {
    this.handleDisconnectResponse(data);
  } else if (L2CAP_CONN_PARAM_UPDATE_REQUEST === code) {
    this.handleConnParamUpdateRequest(data);
  } else if (L2CAP_CONN_PARAM_UPDATE_RESPONSE === code) {
    this.handleConnParamUpdateResponse(data);
  } else if (L2CAP_LE_CONN_REQUEST === code) {
    this.handleConnectionRequest(data);
  } else if (L2CAP_LE_CREDITS === code) {
    this.handleFlowControlCredit(data);
  } else {
    debug('unhandled request: ' + code);
  }
};

L2cap.prototype.handleCommandRejection = function(req) {
  var reason = req.readUInt16LE(4);
  debug('L2CAP Signaling Command Reject: ' + reason);
};

L2cap.prototype.handleDisconnectRequest = function(req) {
  var identifier = req.readUInt8(1);
  var length = req.readUInt16LE(2);

  var reqPacket = req.slice(4);
  if (reqPacket.length !== length) {
    debug('request size error!!!');
    return;
  }

  var dcid = reqPacket.readUInt16LE(0);
  var scid = reqPacket.readUInt16LE(2);

  // In our implementation, we expect dcid and scid to be the same.
  if (dcid !== scid) {
    debug('Destination CID and Source CID mismatch');
    this.rejectCommand(identifier, 0x0002, reqPacket);
    return;
  }

  var stream = this._activeStreams[scid];
  if (!stream) {
    debug('Failed to locate stream');
    this.rejectCommand(identifier, 0x0002, reqPacket);
    return;
  }

  var resp = req;
  resp[0] = L2CAP_DISCONN_RESPONSE;
  this.write(resp);

  stream.invalidate();
  delete this._activeStreams[scid];
};

L2cap.prototype.handleDisconnectResponse = function(req) {
  var identifier = req.readUInt8(1);
  var length = req.readUInt16LE(2);

  var reqPacket = req.slice(4);
  if (reqPacket.length !== length) {
    debug('request size error!!!');
    return;
  }

  var dcid = reqPacket.readUInt16LE(0);
  var scid = reqPacket.readUInt16LE(2);

  debug('Disconnect resp:')
  debug('\tSCID: ' + scid);
  debug('\tDCID: ' + dcid);
};

L2cap.prototype.handleConnParamUpdateRequest = function(req) {

};

L2cap.prototype.handleConnParamUpdateResponse = function(req) {

};

L2cap.prototype.handleConnectionRequest = function(req) {
  debug('LE_CONN request');

  var identifier = req.readUInt8(1);
  var length = req.readUInt16LE(2);

  var reqPacket = req.slice(4);
  if (reqPacket.length !== length) {
    debug('request size error!!!');
    return;
  }

  var psm = reqPacket.readUInt16LE(0);
  var scid = reqPacket.readUInt16LE(2);
  var mtu = reqPacket.readUInt16LE(4);
  var mps = reqPacket.readUInt16LE(6);
  var credits = reqPacket.readUInt16LE(8);

  debug('\tpsm = ' + psm);
  debug('\tscid = ' + scid);
  debug('\tmtu = ' + mtu);
  debug('\tmps = ' + mps);
  debug('\tcredits = ' + credits);

  var resp = Buffer.alloc(14);
  resp[0] = L2CAP_LE_CONN_RESPONSE;
  resp[1] = identifier;
  
  // Length
  resp.writeUInt16LE(0x0A, 2);
  resp.writeUInt16LE(scid, 4);
  resp.writeUInt16LE(mtu, 6);
  resp.writeUInt16LE(mps, 8);
  resp.writeUInt16LE(credits, 10);
  resp.writeUInt16LE(0x0000, 12);

  var stream = undefined;

  if (this._registeredPSMs[psm] === undefined) {
    debug('PSM not registered');
    resp.writeUInt16LE(0x0002, 12);
  } else if (scid < L2CAP_CID_DYN_START || scid > L2CAP_CID_DYN_END) {
    debug('Invalid SCID');
    resp.writeUInt16LE(0x0009, 12);
  } else if (this._activeStreams[scid] !== undefined) {
    debug('SCID already allocated');
    resp.writeUInt16LE(0x000A, 12);
  } else {
    stream = new L2CAPStream(this, psm, scid, mtu, mps, credits);
    this._activeStreams[scid] = stream;
  }

  this.write(resp);

  if (stream) {
    this.emit('newStream', stream);
  }
};

L2cap.prototype.handleFlowControlCredit = function(req) {
  var identifier = req.readUInt8(1);
  var length = req.readUInt16LE(2);

  var reqPacket = req.slice(4);
  if (reqPacket.length !== length) {
    debug('request size error!!!');
    return;
  }

  var cid = reqPacket.readUInt16LE(0);
  var credits = reqPacket.readUInt16LE(2);

  var stream = this._activeStreams[scid];
  if (stream) {
    steam._credits = credits;
  }
};

L2cap.prototype.rejectCommand = function(id, reason, data) {
  var resp = Buffer.alloc(6);
  resp[0] = L2CAP_COMMAND_REJECT;
  resp[1] = id;
  resp.writeUInt16LE(reason, 4);

  if (data) {
    resp = Buffer.concat([
      resp,
      data
    ]);
    resp.writeUInt16LE(2 + data.length, 2);
  } else {
    resp.writeUInt16LE(2, 2);
  }
};

L2cap.prototype.write = function(data) {
  this._aclStream.write(LE_SIGNALING_CID, data);
};

L2cap.prototype.writeChannelData = function(cid, data) {
  this._aclStream.write(cid, data);
};

module.exports = L2cap;