import _ from 'lodash';

const schemes = require('./configurations.mock');

describe('Detox', () => {
  let Detox;
  let detox;
  let minimist;
  let clientMockData = {lastConstructorArguments: null};
  let simulatorMockData = {lastConstructorArguments: null};

  beforeEach(async () => {
    function setCustomMock(modulePath, dataObject) {
      const JestMock = jest.genMockFromModule(modulePath);
      class FinalMock extends JestMock {
        constructor() {
          super(...arguments);
          dataObject.lastConstructorArguments = arguments;
        }
      }
      jest.setMock(modulePath, FinalMock);
    }

    jest.mock('minimist');
    minimist = require('minimist');
    jest.mock('./ios/expect');
    setCustomMock('./client/Client', clientMockData);
    setCustomMock('./devices/Simulator', simulatorMockData);
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

  it(`Passing --cleanup should shutdown the currently running device`, async () => {
    mockCommandLineArgs({cleanup: true});
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
    mockCommandLineArgs({configuration: 'ios.sim.debug'});
    Detox = require('./Detox');

    detox = new Detox(schemes.validTwoDevicesNoSession);
    await detox.init();

    expect(simulatorMockData.lastConstructorArguments[2]).toEqual(schemes.validTwoDevicesNoSession.configurations['ios.sim.debug']);
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

  it(`Detox should use session defined per configuration - none`, async () => {
    mockCommandLineArgs({configuration: 'ios.sim.none'});
    Detox = require('./Detox');
    detox = new Detox(schemes.sessionPerConfiguration);
    await detox.init();

    let expectedSession = schemes.sessionPerConfiguration.configurations['ios.sim.none'].session;
    expect(clientMockData.lastConstructorArguments[0]).toBe(expectedSession);
  });

  it(`Detox should use session defined per configuration - release`, async () => {
    mockCommandLineArgs({configuration: 'ios.sim.release'});
    Detox = require('./Detox');
    detox = new Detox(schemes.sessionPerConfiguration);
    await detox.init();

    let expectedSession = schemes.sessionPerConfiguration.configurations['ios.sim.release'].session;
    expect(clientMockData.lastConstructorArguments[0]).toBe(expectedSession);
  });

  it(`Detox should prefer session defined per configuration over common session`, async () => {
    Detox = require('./Detox');
    detox = new Detox(schemes.sessionInCommonAndInConfiguration);
    await detox.init();

    let expectedSession = schemes.sessionInCommonAndInConfiguration.configurations['ios.sim.none'].session;
    expect(clientMockData.lastConstructorArguments[0]).toBe(expectedSession);
  });

  function mockCommandLineArgs(args) {
    minimist.mockReturnValue(args);
  }
});
