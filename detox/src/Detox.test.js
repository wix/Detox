const schemes = require('./configurations.mock');

describe('Detox', () => {
  let fs;
  let Detox;
  let detox;
  const validDeviceConfig = schemes.validOneDeviceNoSession.configurations['ios.sim.release'];
  const validDeviceConfigWithSession = schemes.sessionPerConfiguration.configurations['ios.sim.none'];
  const invalidDeviceConfig = schemes.invalidDeviceNoDeviceType.configurations['ios.sim.release'];
  const invalidDeviceTypeConfig = schemes.invalidOneDeviceTypeEmulatorNoSession.configurations['ios.sim.release'];
  const validSession = schemes.validOneDeviceAndSession.session;
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
    global.device = undefined;

    jest.mock('./devices/IosDriver');
    jest.mock('./devices/SimulatorDriver');
    jest.mock('./devices/Device');
    jest.mock('detox-server');
    jest.mock('./client/Client');
  });

  it(`Passing --cleanup should shutdown the currently running device`, async () => {
    process.env.cleanup = true;
    Detox = require('./Detox');

    detox = new Detox({deviceConfig: validDeviceConfig});
    await detox.init();
    await detox.cleanup();
    expect(detox.device.shutdown).toHaveBeenCalledTimes(1);
  });

  it(`Not passing --cleanup should keep the currently running device up`, async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfig});
    await detox.init();
    await detox.cleanup();
    expect(detox.device.shutdown).toHaveBeenCalledTimes(0);
  });

  it(`One valid device, detox should init with generated session config and default to this device`, async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfig});
    await detox.init();
    expect(clientMockData.lastConstructorArguments[0]).toBeDefined();
  });

  it(`throws if device type is not supported`, async () => {
    let exception = undefined;

    try {
      Detox = require('./Detox');
      detox = new Detox({deviceConfig: invalidDeviceTypeConfig});
      await detox.init();
    } catch (e) {
      exception = e;
    }

    expect(exception).toBeDefined();
  });

  it(`One valid device, detox should use session config and default to this device`, async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfig, session: validSession});
    await detox.init();

    expect(clientMockData.lastConstructorArguments[0]).toBe(validSession);
  });

  it(`cleanup on a non initialized detox should not throw`, async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: invalidDeviceConfig});
    detox.cleanup();
  });

  it(`Detox should use session defined per configuration `, async () => {
    process.env.configuration = 'ios.sim.none';
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfigWithSession});
    await detox.init();

    const expectedSession = validDeviceConfigWithSession.session;
    expect(clientMockData.lastConstructorArguments[0]).toBe(expectedSession);
  });

  it(`Detox should prefer session defined per configuration over common session`, async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfigWithSession, session: {}});
    await detox.init();

    const expectedSession = validDeviceConfigWithSession.session;
    expect(clientMockData.lastConstructorArguments[0]).toBe(expectedSession);
  });

  it(`beforeEach() - should set device artifacts destination`, async () => {
    process.env.artifactsLocation = '/tmp';
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfigWithSession});
    await detox.init();
    await detox.beforeEach('a', 'b', 'c');
    expect(device.setArtifactsDestination).toHaveBeenCalledTimes(1);
  });

  it(`beforeEach() - should not set device artifacts destination if artifacts not set in cli args`, async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfigWithSession});
    await detox.init();
    await detox.beforeEach('a', 'b', 'c');
    expect(device.setArtifactsDestination).toHaveBeenCalledTimes(0);
  });

  it(`afterEach() - should call device.finalizeArtifacts`, async () => {
    process.env.artifactsLocation = '/tmp';
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfigWithSession});
    await detox.init();
    await detox.afterEach();
    expect(device.finalizeArtifacts).toHaveBeenCalledTimes(1);
  });

  it(`afterEach() - should not call device.finalizeArtifacts if artifacts not set in cli arg`, async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfigWithSession});
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
    detox = new Detox({deviceConfig: validDeviceConfigWithSession});
  });

  it('exports globals by default', async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfigWithSession});
    await detox.init();
    expect(global.device).toBeDefined();
  });

  it(`doesn't exports globals if requested`, async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfigWithSession});
    await detox.init({initGlobals: false});
    expect(global.device).not.toBeDefined();
  });

  it(`handleAppCrash if client has a pending crash`, async () => {
    Detox = require('./Detox');
    detox = new Detox({deviceConfig: validDeviceConfigWithSession});
    await detox.init();
    detox.client.getPendingCrashAndReset.mockReturnValueOnce('crash');
    await detox.afterEach();
    expect(device.launchApp).toHaveBeenCalledTimes(1);
  });
});
