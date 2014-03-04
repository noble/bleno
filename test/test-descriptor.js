var should = require('should');

var Descriptor = require('../lib/descriptor');

describe('Descriptor', function() {
  var mockUuid = 'mockuuid';
  var mockValue = new Buffer('mock value');

  it('should create with uuid option', function() {
    var descriptor = new Descriptor({
      uuid: mockUuid
    });

    descriptor.uuid.should.equal(mockUuid);

    Buffer.isBuffer(descriptor.value).should.equal(true);
    descriptor.value.length.should.equal(0);
  });

  it('should create with value option', function() {
    var descriptor = new Descriptor({
      value: mockValue
    });

    descriptor.value.should.equal(mockValue);
  });

  describe('toString', function() {
    it('should hex buffer value', function() {
      var descriptor = new Descriptor({
        uuid: mockUuid,
        value: mockValue
      });

      descriptor.toString().should.equal('{"uuid":"mockuuid","value":"6d6f636b2076616c7565"}');
    });

    it('should leave non-buffer value alone', function() {
      var descriptor = new Descriptor({
        uuid: mockUuid,
        value: 'mock value'
      });

      descriptor.toString().should.equal('{"uuid":"mockuuid","value":"mock value"}');
    });
  });
});