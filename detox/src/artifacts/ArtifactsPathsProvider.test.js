const _ = require('lodash');

describe('ArtifactsPathsProvider', () => {
  let ArtifactsPathsProvider;
  let fs;
  let mockedDateString = '2017-07-13T06:31:48.544Z';
  let log;

  beforeEach(() => {
    jest.mock('fs');
    fs = require('fs');
    jest.mock('npmlog');
    log = require('npmlog');

    ArtifactsPathsProvider = require('./ArtifactsPathsProvider');
    require('mockdate').set(new Date(mockedDateString));
  });

  it('constructor - should throw on undefined destinationRoot', () => {
    expect(() => {
      new ArtifactsPathsProvider();
    }).toThrowError(/undefined/);
  });

  it('constructor - should throw if can\'t create run directory in the destination', () => {
    fs.mkdirSync = jest.fn(() => {throw 'some'});
    expect(() => {
      new ArtifactsPathsProvider('/tmp');
    }).toThrowError(/Could not create artifacts root dir/);
  });

  it('createPathForTest() - should throw on invalid number', () => {
    function testForNumber(number) {
      expect(() => {
        (new ArtifactsPathsProvider('/tmp')).createPathForTest(number);
      }).toThrowError(/should be a positive integer/);
    }
    testForNumber(undefined);
    testForNumber('1');
    testForNumber(-2);
    testForNumber(0);
    testForNumber('1.2');
  });

  it('createPathForTest() - should return proper path for no components', () => {
    expect((new ArtifactsPathsProvider('/tmp')).createPathForTest(1)).
      toEqual(`/tmp/detox_artifacts.${mockedDateString}/1`);
  });

  it('createPathForTest() - should return proper path for no 1 component', () => {
    expect((new ArtifactsPathsProvider('/tmp')).createPathForTest(1, 'a')).
      toEqual(`/tmp/detox_artifacts.${mockedDateString}/1.a`);
  });

  it('createPathForTest() - should return proper path for no 2 components', () => {
    expect((new ArtifactsPathsProvider('/tmp')).createPathForTest(1, 'a', 'b')).
      toEqual(`/tmp/detox_artifacts.${mockedDateString}/1.a.b`);
  });

  it('createPathsForTest() - should catch mkdirSync exception', () => {
    const artifactsPathsProvider = new ArtifactsPathsProvider('/tmp');
    fs.mkdirSync = jest.fn(() => {throw 'some'});
    artifactsPathsProvider.createPathForTest(1);
    expect(log.warn).toHaveBeenCalledWith('Could not create artifacts test dir: /tmp/detox_artifacts.2017-07-13T06:31:48.544Z/1');
  });
});