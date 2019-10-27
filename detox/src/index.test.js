const schemes = require('./configurations.mock');
describe('index', () => {
  let detox;
  let mockDevice;
  let mockDetox;

  beforeEach(() => {
    mockDevice = { launchApp: jest.fn() };
    mockDetox = {
      init: jest.fn(() => {
        mockDetox.device = mockDevice;
        mockDetox.by = {
          id: jest.fn(),
        };
      }),
      deviceName: jest.fn(),
      cleanup: jest.fn(),
      beforeEach: jest.fn(),
      afterEach: jest.fn(),
    };

    jest
      .mock('./server/DetoxServer')
      .mock('./devices/Device')
      .mock('./utils/logger')
      .mock('./client/Client')
      .mock('./Detox', () => jest.fn(() => mockDetox))

    process.env.DETOX_UNIT_TEST = true;
    detox = require('./index');
  });

  afterEach(() => {
    process.env = {};
    jest
      .unmock('./server/DetoxServer')
      .unmock('./devices/Device')
      .unmock('./client/Client')
      .unmock('./Detox')
  });

  it(`throws if there was no config passed`, async () => {
    const logger = require('./utils/logger');
    let exception = undefined;

    try {
      await detox.init();
    } catch (e) {
      exception = e;
    }

    expect(exception).toBeDefined();
    expect(logger.error).toHaveBeenCalledWith({ event: 'DETOX_INIT_ERROR' }, '\n', exception);
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

  it(`constructs detox with device name passed in '--device-name' cli value`, async () => {
    process.env.deviceName = 'iPhone X';
    const Detox = require('./Detox');

    await detox.init(schemes.validOneDeviceNoSession);

    const expectedConfig = {
      ...schemes.validOneDeviceNoSession.configurations['ios.sim.release'],
      device: 'iPhone X'
    }

    expect(Detox).toHaveBeenCalledWith({
      deviceConfig: expectedConfig,
      session: undefined,
    });
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

  it(`initializes detox`, async () => {
    const params = {};

    await detox.init(schemes.validOneDeviceNoSession, params);

    expect(mockDetox.init).toHaveBeenCalledWith(params);
  });

  it(`Basic usage`, async() => {
    await detox.init(schemes.validOneDeviceNoSession);
    await detox.cleanup();
  });

  it(`Basic usage with memorized exported objects`, async() => {
    const { device, by } = detox;

    expect(device.launchApp).toBe(undefined);
    expect(by.id).toBe(undefined);

    await detox.init(schemes.validOneDeviceNoSession);

    expect(device.launchApp).toEqual(expect.any(Function));
    expect(by.id).toEqual(expect.any(Function));

    await detox.cleanup();

    expect(device.launchApp).toBe(undefined);
    expect(by.id).toBe(undefined);
  });

  it(`Basic usage, do not throw an error if cleanup is done twice`, async() => {
    await detox.init(schemes.validOneDeviceNoSession);
    await detox.cleanup();
    await detox.cleanup();
  });

  it(`Basic usage, if detox is undefined, do not throw an error`, async() => {
    await detox.cleanup();
  });

  it(`if detox.init() fails, detox.cleanup() is called automatically`, async () => {
    mockDetox.init.mockImplementation(() => { throw new Error('test'); });
    expect(detox.init(schemes.validOneDeviceNoSession)).rejects.toThrow();
    expect(mockDetox.cleanup).toHaveBeenCalled();
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
