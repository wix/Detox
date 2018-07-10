const schemes = require('./configurations.mock');
describe('index', () => {
  let detox;
  const mockDevice = {};
  const mockDetox = {
    device: mockDevice,
    init: jest.fn(),
    cleanup: jest.fn(),
    beforeEach: jest.fn(),
    afterEach: jest.fn(),
  };

  beforeEach(() => {
    jest
      .mock('detox-server')
      .mock('./devices/Device')
      .mock('./utils/onTerminate')
      .mock('./client/Client')
      .mock('./Detox', () => jest.fn(() => mockDetox))
      .mock('./platform');

    process.env.DETOX_UNIT_TEST = true;
    detox = require('./index');
  });

  afterEach(() => {
    process.env = {};
    jest
      .unmock('detox-server')
      .unmock('./devices/Device')
      .unmock('./utils/onTerminate')
      .unmock('./client/Client')
      .unmock('./Detox')
      .unmock('./platform');
  });

  it(`throws if there was no config passed`, async () => {
    let exception = undefined;

    try {
      await detox.init();
    } catch (e) {
      exception = e;
    }

    expect(exception).toBeDefined();
  });

  it(`throws if there is no devices in config`, async () => {
    let exception = undefined;

    try {
      await detox.init(schemes.invalidNoDevice);
    } catch (e) {
      exception = e;
    }

    expect(exception).toBeDefined();
  });

  it(`constructs detox with device config`, async () => {
    const Detox = require('./Detox');

    await detox.init(schemes.validOneDeviceNoSession);

    expect(Detox).toHaveBeenCalledWith({
      deviceConfig: schemes.validOneDeviceNoSession.configurations['ios.sim.release'],
      session: undefined,
    });
  });

  it(`constructs detox with device config passed in '--configuration' cli value`, async () => {
    process.env.configuration = 'ios.sim.debug';
    const Detox = require('./Detox');

    await detox.init(schemes.validTwoDevicesNoSession);

    expect(Detox).toHaveBeenCalledWith({
      deviceConfig: schemes.validTwoDevicesNoSession.configurations['ios.sim.debug'],
      session: undefined,
    });
  });

  it(`throws if device passed in '--configuration' cli option doesn't exist`, async () => {
    let exception = undefined;
    process.env.configuration = 'nonexistent';

    try {
      await detox.init(schemes.validTwoDevicesNoSession);
    } catch (e) {
      exception = e;
    }

    expect(exception).toBeDefined();
  });

  it(`throws if a device has no name`, async () => {
    let exception = undefined;

    try {
      await detox.init(schemes.invalidDeviceNoDeviceName);
    } catch (e) {
      exception = e;
    }

    expect(exception).toBeDefined();
  });

  it(`throws if a device is invalid`, async () => {
    let exception = undefined;

    try {
      await detox.init(schemes.invalidDeviceNoDeviceType);
    } catch (e) {
      exception = e;
    }

    expect(exception).toBeDefined();
  });

  it(`throws if a device is invalid`, async () => {
    let exception = undefined;

    try {
      await detox.init(schemes.invalidDeviceNoDeviceType);
    } catch (e) {
      exception = e;
    }

    expect(exception).toBeDefined();
  });

  it(`sets platform`, async () => {
    const platform = require('./platform');

    await detox.init(schemes.validOneDeviceNoSession);

    expect(platform.set).toHaveBeenCalledWith(
      'ios.simulator',
      mockDevice,
    );
  });

  it(`initializes detox`, async () => {
    const params = {};

    await detox.init(schemes.validOneDeviceNoSession, params);

    expect(mockDetox.init).toHaveBeenCalledWith(params);
  });

  it(`Basic usage`, async() => {
    await detox.init(schemes.validOneDeviceNoSession);
    await detox.cleanup();
  });

  it(`Basic usage, if detox is undefined, do not throw an error`, async() => {
    await detox.cleanup();
  });

  it(`beforeEach() should be covered - with detox initialized`, async() => {
    await detox.init(schemes.validOneDeviceNoSession);
    await detox.beforeEach();
  });

  it(`beforeEach() should be covered - with detox not initialized`, async() => {
    await detox.beforeEach();
  });

  it(`afterEach() should be covered - with detox initialized`, async() => {
    await detox.init(schemes.validOneDeviceNoSession);
    await detox.afterEach();
  });

  it(`afterEach() should be covered - with detox not initialized`, async() => {
    await detox.afterEach();
  });
});
