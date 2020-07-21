describe('Detox matchers registry', () => {

  const opts = {
    some: 'object',
  };

  let androidExpect;
  let iosExpect;
  let device;
  let resolveModuleFromPath;
  let uut;
  beforeEach(() => {
    androidExpect = {
      ctor: jest.fn(),
    };

    class MockAndroidExpect {
      constructor(...args) {
        this.mockName = 'mock-android-expect';
        androidExpect.ctor(...args);
      }
    }
    jest.mock('./android/expect', () => MockAndroidExpect);

    iosExpect = {
      ctor: jest.fn(),
    }
    class MockIosExpect {
      constructor(...args) {
        this.mockName = 'mock-ios-expect';
        iosExpect.ctor(...args);
      }
    }
    jest.mock('./ios/expectTwo', () => MockIosExpect);

    class MockExternalModuleExpect {
      constructor() {
        this.mockName = 'external-module-expect';
      }
    }
    jest.mock('./utils/resolveModuleFromPath');
    resolveModuleFromPath = require('./utils/resolveModuleFromPath');
    resolveModuleFromPath.mockReturnValue({
      ExpectClass: MockExternalModuleExpect,
    });

    device = {
      getPlatform: jest.fn(),
    };

    uut = require('./matchersRegistry');
  });

  const withAndroidDevice = () => device.getPlatform.mockReturnValue('android');
  const withIosDevice = () => device.getPlatform.mockReturnValue('ios');
  const withUnknownDevice = (deviceType) => {
    device.getPlatform.mockReturnValue(undefined);
    device.type = deviceType;
  }

  it('should resolve the Android matchers', () => {
    withAndroidDevice();
    const result = uut.resolve(device);
    expect(result.mockName).toEqual('mock-android-expect');
  });

  it('should init the matchers with opts', () => {
    withAndroidDevice();

    uut.resolve(device, opts);
    expect(androidExpect.ctor).toHaveBeenCalledWith(opts);
  });

  it('should resolve the iOS matchers', () => {
    withIosDevice();
    const result = uut.resolve(device);
    expect(result.mockName).toEqual('mock-ios-expect');
  });

  it('should init the ios-matchers with opts', () => {
    withIosDevice();
    uut.resolve(device, opts);
    expect(iosExpect.ctor).toHaveBeenCalledWith(opts);
  });

  it('should resort to type-as-path based resolution if platform is not recognized', () => {
    const deviceType = './path/to/external/module/index.js';
    withUnknownDevice(deviceType);

    const result = uut.resolve(device, opts);
    expect(result.mockName).toEqual('external-module-expect');
    expect(resolveModuleFromPath).toHaveBeenCalledWith(deviceType);
  });
});
