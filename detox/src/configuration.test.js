const _ = require('lodash');
const schemes = require('./schemes.mock');

describe('configuration', () => {
  let configuration;
  beforeEach(() => {
    configuration = require('./configuration');
  });

  it(`generate a default config`, async () => {
    const config = await configuration.defaultSession();
    expect(() => config.session.server).toBeDefined();
    expect(() => config.session.sessionId).toBeDefined();
  });

  it(`providing a valid config`, () => {
    expect(() => configuration.validateSession(schemes.validOneDeviceAndSession.session)).not.toThrow();
  });

  it(`providing empty server config should throw`, () => {
    testFaultySession();
  });

  it(`providing server config with no session should throw`, () => {
    testFaultySession(schemes.validOneDeviceNoSession.session);
  });

  it(`providing server config with no session.server should throw`, () => {
    testFaultySession(schemes.invalidSessionNoServer.session);
  });

  it(`providing server config with no session.sessionId should throw`, () => {
    testFaultySession(schemes.invalidSessionNoSessionId.session);
  });

  it(`providing device config with no binaryPath should throw`, () => {
    testFaultyDevice(schemes.invalidDeviceNoBinary);
  });

  it(`providing device config with no name should throw`, () => {
    testFaultyDevice(schemes.invalidDeviceNoDeviceName);
  });

  function testFaultySession(config) {
    try {
      configuration.validateSession(config);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  }

  function testFaultyDevice(config) {
    const deviceConfig = _.values(config.devices)[0];

    try {
      configuration.validateDevice(deviceConfig);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  }
});
