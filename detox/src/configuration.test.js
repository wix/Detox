const schemes = require('./schemes.mock');
describe('configuration', () => {
  let configuration;
  beforeEach(() => {
    configuration = require('./configuration');
  });

  it(`providing a valid config`, () => {

    expect(() => configuration.validateConfig(schemes.valid)).not.toThrow();
  });

  it(`providing empty config should throw`, () => {
    testFaultyConfig('');
  });

  it(`providing config with no session should throw`, () => {
    testFaultyConfig(schemes.noSession);
  });

  it(`providing config with no session.server should throw`, () => {
    testFaultyConfig(schemes.noServer)
  });

  it(`providing config with no session.sessionId should throw`, () => {
    testFaultyConfig(schemes.noSessionId)
  });

  function testFaultyConfig(config) {
    try {
      configuration.validateConfig(config);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  }
});
