const schemes = require('./configurations.mock');

describe('Detox', () => {
  let Detox;
  let detox;
  let minimist;

  beforeEach(async () => {
    jest.mock('minimist');
    minimist = require('minimist');
    jest.mock('./ios/expect');
    jest.mock('./client/client');
    jest.mock('./devices/simulator');
    jest.mock('detox-server');
  });

  it(`No config is passed to init, should throw`, async () => {
    Detox = require('./Detox');
    try {
      detox = new Detox();
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`Config with no devices, should throw`, async () => {
    Detox = require('./Detox');
    try {
      detox = new Detox(schemes.invalidNoDevice);
      await detox.init();
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`Config with emulator, should throw`, async () => {
    Detox = require('./Detox');
    try {
      detox = new Detox(schemes.invalidOneDeviceTypeEmulatorNoSession);
      await detox.init();
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`One valid device, detox should init with generated session config and default to this device`, async () => {
    Detox = require('./Detox');
    detox = new Detox(schemes.validOneDeviceNoSession);
    await detox.init();

    expect(detox.detoxConfig.session.server).toBeDefined();
    expect(detox.detoxConfig.session.sessionId).toBeDefined();
  });

  it(`One valid device, detox should use session config and default to this device`, async () => {
    Detox = require('./Detox');
    detox = new Detox(schemes.validOneDeviceAndSession);
    await detox.init();

    expect(detox.detoxConfig.session.server).toBe(schemes.validOneDeviceAndSession.session.server);
    expect(detox.detoxConfig.session.sessionId).toBe(schemes.validOneDeviceAndSession.session.sessionId);
  });

  it(`Two valid devices, detox should init with the device passed in '--configuration' cli option`, async () => {
    mockCommandLineArgs({configuration: 'ios.sim.debug'});
    Detox = require('./Detox');

    detox = new Detox(schemes.validTwoDevicesNoSession);
    await detox.init();

    expect(detox.detoxConfig.configurations).toEqual(schemes.validTwoDevicesNoSession.configurations);
  });

  it(`Two valid devices, detox should throw if device passed in '--configuration' cli option doesn't exist`, async () => {
    mockCommandLineArgs({configuration: 'nonexistent'});
    Detox = require('./Detox');

    detox = new Detox(schemes.validTwoDevicesNoSession);

    try {
      await detox.init();
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`Two valid devices, detox should throw if device passed in '--configuration' cli option doesn't exist`, async () => {
    mockCommandLineArgs({configuration: 'nonexistent'});
    Detox = require('./Detox');

    detox = new Detox(schemes.validTwoDevicesNoSession);

    try {
      await detox.init();
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`One invalid device, detox should throw`, async () => {
    Detox = require('./Detox');

    detox = new Detox(schemes.invalidDeviceNoDeviceType);

    try {
      await detox.init();
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`cleanup on a non initialized detox should not throw`, async () => {
    Detox = require('./Detox');
    detox = new Detox(schemes.invalidDeviceNoDeviceType);
    //expect(detox.cleanup).not.toThrow();
    detox.cleanup();
  });

  function mockCommandLineArgs(args) {
    minimist.mockReturnValue(args);
  }
});
