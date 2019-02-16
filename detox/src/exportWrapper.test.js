let exportWrapper;
let platform;
const iosExports = {
  by: {
    method: jest.fn()
  },
  expect: jest.fn(),
  element: jest.fn(),
  waitFor: jest.fn(),
};
const androidExports = {
  by: {
    method: jest.fn()
  },
  expect: jest.fn(),
  element: jest.fn(),
  waitFor: jest.fn(),
};

describe('exportWrapper', () => {
  const mockDevice = {method: jest.fn()};

  beforeAll(async() => {
    jest.doMock('./ios/expect', () => jest.fn().mockImplementation(() => iosExports));
    jest.doMock('./android/expect', () => jest.fn().mockImplementation(() => androidExports));

    exportWrapper = require('./exportWrapper');
    platform = require('./platform');
  });

  afterAll(async() => {
    jest.unmock('./ios/expect');
    jest.unmock('./android/expect');
  });

  it(`proxies ios specific objects`, async () => {
    const arg1 = 1;
    const arg2 = 'test';

    platform.set('ios.none', mockDevice);

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
