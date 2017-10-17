const schemes = require('./configurations.mock');

describe('Detox', () => {
  let fs;
  let Detox;
  let detox;
  const clientMockData = {lastConstructorArguments: null};
  const deviceMockData = {lastConstructorArguments: null};

  beforeEach(async () => {
    function setCustomMock(modulePath, dataObject) {
      const JestMock = jest.genMockFromModule(modulePath);
      class FinalMock extends JestMock {
        constructor(...rest) {
          super(rest);
          dataObject.lastConstructorArguments = rest;
        }
      }
      jest.setMock(modulePath, FinalMock);
    }

    jest.mock('npmlog');
    jest.mock('fs');
    fs = require('fs');
    jest.mock('./ios/expect');
    setCustomMock('./client/Client', clientMockData);
    setCustomMock('./devices/Device', deviceMockData);

    process.env = {};

    jest.mock('./devices/IosDriver');
    jest.mock('./devices/SimulatorDriver');
    jest.mock('./devices/Device');
    jest.mock('detox-server');
    jest.mock('./client/Client');
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

  it(`Passing --cleanup should shutdown the currently running device`, async () => {
    process.env.cleanup = true;
    Detox = require('./Detox');

    detox = new Detox(schemes.validOneDeviceNoSession);
    await detox.init();
    await detox.cleanup();
    expect(detox.device.shutdown).toHaveBeenCalledTimes(1);
  });

  it(`Not passing --cleanup should keep the currently running device up`, async () => {
    Detox = require('./Detox');
    detox = new Detox(schemes.validOneDeviceNoSession);
    await detox.init();
    await detox.cleanup();
    expect(detox.device.shutdown).toHaveBeenCalledTimes(0);
  });

  it(`One valid device, detox should init with generated session config and default to this device`, async () => {
    Detox = require('./Detox');
    detox = new Detox(schemes.validOneDeviceNoSession);
    await detox.init();
    expect(clientMockData.lastConstructorArguments[0]).toBeDefined();
  });

  it(`One valid device, detox should use session config and default to this device`, async () => {
    Detox = require('./Detox');
    detox = new Detox(schemes.validOneDeviceAndSession);
    await detox.init();

    expect(clientMockData.lastConstructorArguments[0]).toBe(schemes.validOneDeviceAndSession.session);
  });

  it(`Two valid devices, detox should init with the device passed in '--configuration' cli option`, async () => {
    process.env.configuration = 'ios.sim.debug';
    Detox = require('./Detox');

    detox = new Detox(schemes.validTwoDevicesNoSession);
    await detox.init();
    expect(deviceMockData.lastConstructorArguments[0]).toEqual(schemes.validTwoDevicesNoSession.configurations['ios.sim.debug']);
  });

  it(`Two valid devices, detox should throw if device passed in '--configuration' cli option doesn't exist`, async () => {
    process.env.configuration = 'nonexistent';
    Detox = require('./Detox');

    detox = new Detox(schemes.validTwoDevicesNoSession);

    try {
      await detox.init();
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`Two valid devices, detox should throw if device passed in '--configuration' cli option doesn't exist`, async () => {
    process.env.configuration = 'nonexistent';
    Detox = require('./Detox');

    detox = new Detox(schemes.validTwoDevicesNoSession);

    try {
      await detox.init();
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`One invalid device (no device name), detox should throw`, async () => {
    Detox = require('./Detox');

    detox = new Detox(schemes.invalidDeviceNoDeviceName);

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
      fail('should have thrown');
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  });

  it(`cleanup on a non initialized detox should not throw`, async () => {
    Detox = require('./Detox');
    detox = new Detox(schemes.invalidDeviceNoDeviceType);
    detox.cleanup();
  });

  it(`Detox should use session defined per configuration - none`, async () => {
    process.env.configuration = 'ios.sim.none';
    Detox = require('./Detox');
    detox = new Detox(schemes.sessionPerConfiguration);
    await detox.init();

    const expectedSession = schemes.sessionPerConfiguration.configurations['ios.sim.none'].session;
    expect(clientMockData.lastConstructorArguments[0]).toBe(expectedSession);
  });

  it(`Detox should use session defined per configuration - release`, async () => {
    process.env.configuration = 'ios.sim.release';
    Detox = require('./Detox');
    detox = new Detox(schemes.sessionPerConfiguration);
    await detox.init();

    const expectedSession = schemes.sessionPerConfiguration.configurations['ios.sim.release'].session;
    expect(clientMockData.lastConstructorArguments[0]).toBe(expectedSession);
  });

  it(`Detox should prefer session defined per configuration over common session`, async () => {
    Detox = require('./Detox');
    detox = new Detox(schemes.sessionInCommonAndInConfiguration);
    await detox.init();

    const expectedSession = schemes.sessionInCommonAndInConfiguration.configurations['ios.sim.none'].session;
    expect(clientMockData.lastConstructorArguments[0]).toBe(expectedSession);
  });

  it(`beforeEach() - should set device artifacts destination`, async () => {
    process.env.artifactsLocation = '/tmp';
    Detox = require('./Detox');
    detox = new Detox(schemes.validOneDeviceAndSession);
    await detox.init();
    await detox.beforeEach('a', 'b', 'c');
    expect(device.setArtifactsDestination).toHaveBeenCalledTimes(1);
  });

  it(`beforeEach() - should not set device artifacts destination if artifacts not set in cli args`, async () => {
    Detox = require('./Detox');
    detox = new Detox(schemes.validOneDeviceAndSession);
    await detox.init();
    await detox.beforeEach('a', 'b', 'c');
    expect(device.setArtifactsDestination).toHaveBeenCalledTimes(0);
  });

  it(`afterEach() - should call device.finalizeArtifacts`, async () => {
    process.env.artifactsLocation = '/tmp';
    Detox = require('./Detox');
    detox = new Detox(schemes.validOneDeviceAndSession);
    await detox.init();
    await detox.afterEach();
    expect(device.finalizeArtifacts).toHaveBeenCalledTimes(1);
  });

  it(`afterEach() - should not call device.finalizeArtifacts if artifacts not set in cli arg`, async () => {
    Detox = require('./Detox');
    detox = new Detox(schemes.validOneDeviceAndSession);
    await detox.init();
    await detox.afterEach();
    expect(device.finalizeArtifacts).toHaveBeenCalledTimes(0);
  });

  it(`the constructor should catch exception from ArtifactsPathsProvider`, async () => {
    process.env.artifactsLocation = '/tmp';
    fs.mkdirSync = jest.fn(() => {
      throw Error('Could not create artifacts root dir');
    });
    Detox = require('./Detox');
    detox = new Detox(schemes.validOneDeviceAndSession);
  });
});
