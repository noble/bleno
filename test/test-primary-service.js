/* jshint mocha: true */

var should = require('should');

var PrimaryService = require('../lib/primary-service');

describe('PrimaryService', function() {
  var mockUuid = 'mockuuid';
  var mockCharacteristics = [{}, {}, {}];

  it('should create with uuid option', function() {
    var service = new PrimaryService({
      uuid: mockUuid
    });

    service.uuid.should.equal(mockUuid);

    Array.isArray(service.characteristics).should.equal(true);
    service.characteristics.length.should.equal(0);
  });

  it('should create with characteristics option', function() {
    var service = new PrimaryService({
      characteristics: mockCharacteristics
    });

    service.characteristics.should.equal(mockCharacteristics);
  });

  it('should toString', function() {
    var service = new PrimaryService({
      uuid: mockUuid
    });

    service.toString().should.equal('{"uuid":"mockuuid","characteristics":[]}');
  });
});