const schemes = require('./configurations.mock');
describe('index', () => {
  let detox, mockDetox;
  beforeEach(() => {
    jest.mock('detox-server');
    jest.mock('./devices/Device');
    jest.mock('./client/Client');
    jest.mock('./Detox');
    mockDetox = require('./Detox');
    detox = require('./index');
    global.console.error = jest.fn();
  });

  it(`Basic usage`, async() => {
    await detox.init(schemes.validOneDeviceNoSession);
    await detox.cleanup();
  });

  it(`Basic usage, if detox is undefined, do not throw an error`, async() => {
    await detox.cleanup();
  });

  it('Basic usage, if init throws, log a clear explanation', async () => {
    mockDetox.mockImplementation(() => ({
      init: () => Promise.reject(new Error('Some tragic event occurred'))
    }));
    try {
      await detox.init(schemes.validOneDeviceNoSession);
    } catch (e) {
      expect(e).toBeDefined();
      expect(global.console.error).toHaveBeenCalledWith('Error during detox initialization: Some tragic event occurred');
    }
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
