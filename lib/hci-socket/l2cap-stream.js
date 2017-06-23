var debug = require('debug')('l2cap-stream');

var events = require('events');
var util = require('util');

var L2CAPStream = function(l2cap, psm, channel, mtu, mps, credits) {
  this.psm = psm;

  this._isValid = true;
  this._l2cap = l2cap;
  this._channel = channel;
  this._mtu = mtu;
  this._mps = mps;
  this._credits = credits;

  this._expectedLength = 0;
  this._pendingBuffer = null;
};

util.inherits(L2CAPStream, events.EventEmitter);


L2CAPStream.prototype.write = function(data) {
  if (!this._isValid) {
    throw 'Invalid L2CAP Stream';
    return;
  }

  if (!data) {
    return;
  }

  if ((data.length + 2) <= this._mps) {
    var lengthBuf = new Buffer(2);
    lengthBuf.writeUInt16LE(data.length);
    var dataBuf = Buffer.concat([
      lengthBuf,
      data
    ]);

    this._l2cap.writeChannelData(this._channel, dataBuf);
  } else {
    var buf = data;
    var lengthBuf = new Buffer(2);

    while(buf.length) {
      var frag = buf.slice(0, (this._mps - 2));
      buf = buf.slice(frag.length);
      lengthBuf.writeUInt16LE(frag.length);
      var dataBuf = Buffer.concat([
        lengthBuf,
        frag
      ]);

      this._l2cap.writeChannelData(this._channel, dataBuf);
    }
  }
};

L2CAPStream.prototype.push = function(data) {
  if (data) {
    if (this._pendingBuffer === null) {
      var length = data.readUInt16LE(0);
      if (length === (data.length - 2)) {
        this.emit('data', data.slice(2));
      } else {
        this._expectedLength = length;
        this._pendingBuffer = data.slice(2);
      }
    } else {
      this._pendingBuffer = Buffer.concat([
        this._pendingBuffer,
        data
      ]);
      if (this._pendingBuffer.length === this._expectedLength) {
        this.emit('data', this._pendingBuffer);
        this._pendingBuffer = null;
        this._expectedLength = 0;
      }
    }
  } else {
    this.emit('end');
  }
};

L2CAPStream.prototype.invalidate = function() {
  this._isValid = false;
  this.emit('invalidate');
}

module.exports = L2CAPStream;
