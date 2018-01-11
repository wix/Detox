let exportWrapper;
let platform;
let iosExports;
let androidExports;

describe('exportWrapper', () => {
  const mockDevice = {method: jest.fn()};

  beforeAll(async() => {
    jest.mock('./ios/expect');
    jest.mock('./android/expect');
    exportWrapper = require('./exportWrapper');
    platform = require('./platform');
    iosExports = require('./ios/expect');
    androidExports = require('./android/expect');
  });

  afterAll(async() => {
    jest.unmock('./ios/expect');
    jest.unmock('./android/expect');
  });

  it(`proxies ios specific objects`, async () => {
    const arg1 = 1;
    const arg2 = 'test';

    platform.set('ios.none', mockDevice);
    iosExports.by.method = jest.fn();

    exportWrapper.device.method(arg1, arg2);
    expect(mockDevice.method).toHaveBeenCalledWith(arg1, arg2);

    exportWrapper.expect(arg1, arg2);
    expect(iosExports.expect).toHaveBeenCalledWith(arg1, arg2);

    exportWrapper.element(arg1, arg2);
    expect(iosExports.element).toHaveBeenCalledWith(arg1, arg2);

    exportWrapper.waitFor(arg1, arg2);
    expect(iosExports.waitFor).toHaveBeenCalledWith(arg1, arg2);

    exportWrapper.by.method(arg1, arg2);
    expect(iosExports.by.method).toHaveBeenCalledWith(arg1, arg2);
  });

  it(`proxies android specific objects`, async () => {
    const arg1 = 1;
    const arg2 = 'test';

    platform.set('android.attached', mockDevice);
    androidExports.by.method = jest.fn();

    exportWrapper.device.method(arg1, arg2);
    expect(mockDevice.method).toHaveBeenCalledWith(arg1, arg2);

    exportWrapper.expect(arg1, arg2);
    expect(androidExports.expect).toHaveBeenCalledWith(arg1, arg2);

    exportWrapper.element(arg1, arg2);
    expect(androidExports.element).toHaveBeenCalledWith(arg1, arg2);

    exportWrapper.waitFor(arg1, arg2);
    expect(androidExports.waitFor).toHaveBeenCalledWith(arg1, arg2);

    exportWrapper.by.method(arg1, arg2);
    expect(androidExports.by.method).toHaveBeenCalledWith(arg1, arg2);
  });
});
