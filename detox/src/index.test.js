const schemes = require('./schemes.mock');
describe('index', () => {
  let detox;
  beforeEach(() => {
    jest.mock('detox-server');
    jest.mock('./devices/simulator');
    jest.mock('./client/client');
    detox = require('./index');
  });

  it(`Basic usage`, async() => {
    await detox.init(schemes.validOneDeviceNoSession);
    await detox.cleanup();
  });

  it(`Basic usage`, async() => {
    await detox.cleanup();
  });
});
