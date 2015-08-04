var debug = require('debug')('mgmt');

var events = require('events');
var util = require('util');

var BluetoothHciSocket = require('bluetooth-hci-socket');

var LTK_INFO_SIZE = 36;

var MGMT_OP_LOAD_LONG_TERM_KEYS = 0x0013;

function Mgmt() {
  this._socket = new BluetoothHciSocket();
  this._ltkInfos = [];

  this._socket.on('data', this.onSocketData.bind(this));
  this._socket.on('error', this.onSocketError.bind(this));

  this._socket.bindControl();
  this._socket.start();
}

Mgmt.prototype.onSocketData = function(data) {
  debug('on data ->' + data.toString('hex'));
};

Mgmt.prototype.onSocketError = function(error) {
  debug('on error ->' + error.message);
};

Mgmt.prototype.addLongTermKey = function(address, addressType, authenticated, master, ediv, rand, key) {
  var ltkInfo = new Buffer(LTK_INFO_SIZE);

  address.copy(ltkInfo, 0);
  ltkInfo.writeUInt8(addressType.readUInt8(0) + 1, 6); // BDADDR_LE_PUBLIC = 0x01, BDADDR_LE_RANDOM 0x02, so add one

  ltkInfo.writeUInt8(authenticated, 7);
  ltkInfo.writeUInt8(master, 8);
  ltkInfo.writeUInt8(key.length, 9);

  ediv.copy(ltkInfo, 10);
  rand.copy(ltkInfo, 12);
  key.copy(ltkInfo, 20);

  this._ltkInfos.push(ltkInfo);

  this.loadLongTermKeys();
};

Mgmt.prototype.clearLongTermKeys = function() {
  this._ltkInfos = [];

  this.loadLongTermKeys();
};

Mgmt.prototype.loadLongTermKeys = function() {
  var numLongTermKeys = this._ltkInfos.length;
  var op = new Buffer(2 + numLongTermKeys * LTK_INFO_SIZE);

  op.writeUInt16LE(numLongTermKeys, 0);

  for (var i = 0; i < numLongTermKeys; i++) {
    this._ltkInfos[i].copy(op, 2 + i * LTK_INFO_SIZE);
  }

  this.write(MGMT_OP_LOAD_LONG_TERM_KEYS, 0, op);
};

Mgmt.prototype.write = function(opcode, index, data) {
  var length = 0;

  if (data) {
    length = data.length;
  }

  var pkt = new Buffer(6 + length);

  pkt.writeUInt16LE(opcode, 0);
  pkt.writeUInt16LE(index, 2);
  pkt.writeUInt16LE(length, 4);

  if (length) {
    data.copy(pkt, 6);
  }

  debug('writing -> ' + pkt.toString('hex'));
  this._socket.write(pkt);
};

module.exports = new Mgmt();
