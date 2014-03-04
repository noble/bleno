var should = require('should');

var Characteristic = require('../lib/characteristic');

describe('Characteristic', function() {
  var mockUuid = 'mockuuid';
  var mockProperties = ['property1', 'property2', 'property3'];
  var mockSecure = ['secure1', 'secure2', 'secure3'];
  var mockValue = new Buffer('mock value');
  var mockDescriptors = [{}, {}, {}];

  var mockOnReadRequest = function() {};
  var mockOnWriteRequest = function() {};
  var mockOnSubscribe = function() {};
  var mockOnUnsubscribe = function() {};
  var mockOnNotify = function() {};

  var mockMaxValueSize = 20;
  var mockUpdateValueCallback = function() {};

  it('should create with uuid option', function() {
    var characteristic = new Characteristic({
      uuid: mockUuid
    });

    characteristic.uuid.should.equal(mockUuid);

    Array.isArray(characteristic.properties).should.equal(true);
    characteristic.properties.length.should.equal(0);

    Array.isArray(characteristic.secure).should.equal(true);
    characteristic.secure.length.should.equal(0);

    should(characteristic.value).equal(null);

    Array.isArray(characteristic.descriptors).should.equal(true);
    characteristic.descriptors.length.should.equal(0);
  });

  it('should create with properties option', function() {
    var characteristic = new Characteristic({
      properties: mockProperties
    });

    characteristic.properties.should.equal(mockProperties);
  });

  it('should create with secure option', function() {
    var characteristic = new Characteristic({
      secure: mockSecure
    });

    characteristic.secure.should.equal(mockSecure);
  });

  it('should create with value option', function() {
    var characteristic = new Characteristic({
      value: mockValue
    });

    characteristic.value.should.equal(mockValue);
  });

  it('should create with descriptors option', function() {
    var characteristic = new Characteristic({
      descriptors: mockDescriptors
    });

    characteristic.descriptors.should.equal(mockDescriptors);
  });

  it('should create with onReadRequest option', function() {
    var characteristic = new Characteristic({
      onReadRequest: mockOnReadRequest
    });

    characteristic.onReadRequest.should.equal(mockOnReadRequest);
  });

  it('should create with onWriteRequest option', function() {
    var characteristic = new Characteristic({
      onWriteRequest: mockOnWriteRequest
    });

    characteristic.onWriteRequest.should.equal(mockOnWriteRequest);
  });

  it('should create with onSubscribe option', function() {
    var characteristic = new Characteristic({
      onSubscribe: mockOnSubscribe
    });

    characteristic.onSubscribe.should.equal(mockOnSubscribe);
  });

  it('should create with onUnsubscribe option', function() {
    var characteristic = new Characteristic({
      onUnsubscribe: mockOnUnsubscribe
    });

    characteristic.onUnsubscribe.should.equal(mockOnUnsubscribe);
  });

  it('should create with onNotify option', function() {
    var characteristic = new Characteristic({
      onNotify: mockOnNotify
    });

    characteristic.onNotify.should.equal(mockOnNotify);
  });

  it('should toString', function() {
    var characteristic = new Characteristic({
      uuid: mockUuid
    });

    characteristic.toString().should.equal('{"uuid":"mockuuid","properties":[],"secure":[],"value":null,"descriptors":[]}');
  });

  it('should handle read request', function(done) {
    var characteristic = new Characteristic({});

    characteristic.emit('readRequest', 0, function(result, data) {
      result.should.equal(0x0e);
      should(data).equal(null);

      done();
    });
  });

  it('should handle write request', function(done) {
    var characteristic = new Characteristic({});

    characteristic.emit('writeRequest', new Buffer(0), 0, false, function(result) {
      result.should.equal(0x0e);

      done();
    });
  });

  it('should handle unsubscribe', function() {
    var characteristic = new Characteristic({});

    characteristic.maxValueSize = mockMaxValueSize;
    characteristic.updateValueCallback = mockUpdateValueCallback;

    characteristic.emit('unsubscribe');

    should(characteristic.maxValueSize).equal(null);
    should(characteristic.updateValueCallback).equal(null);
  });

  it('should handle unsubscribe', function() {
    var characteristic = new Characteristic({});
    
    characteristic.emit('notify');
  });
});