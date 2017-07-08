const schemes = require('./configurations.mock');
describe('index', () => {
  let detox;
  beforeEach(() => {
    jest.mock('detox-server');
    jest.mock('./devices/Device');
    jest.mock('./client/Client');
    detox = require('./index');
  });

  it(`Basic usage`, async() => {
    await detox.init(schemes.validOneDeviceNoSession);
    await detox.cleanup();
  });

  it(`Basic usage, if detox is undefined, do not throw an error`, async() => {
    await detox.cleanup();
  });
});
