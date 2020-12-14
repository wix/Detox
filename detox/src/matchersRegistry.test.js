describe('Detox matchers registry', () => {

  class MockExternalModuleExpect {}

  const opts = {
    some: 'object',
  };

  let AndroidExpect;
  let IosExpect;
  let device;
  let resolveModuleFromPath;
  let uut;
  beforeEach(() => {
    jest.mock('./android/expect');
    AndroidExpect = require('./android/expect');

    jest.mock('./ios/expectTwo');
    IosExpect = require('./ios/expectTwo');

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
    expect(result).toBeInstanceOf(AndroidExpect);
  });

  it('should init the Android-matchers with opts', () => {
    withAndroidDevice();
    uut.resolve(device, opts);
    expect(AndroidExpect).toHaveBeenCalledWith(opts);
  });

  it('should resolve the iOS matchers', () => {
    withIosDevice();
    const result = uut.resolve(device);
    expect(result).toBeInstanceOf(IosExpect);
  });

  it('should init the ios-matchers with opts', () => {
    withIosDevice();
    uut.resolve(device, opts);
    expect(IosExpect).toHaveBeenCalledWith(opts);
  });

  it('should resort to type-as-path based resolution if platform is not recognized', () => {
    const deviceType = './path/to/external/module/index.js';
    withUnknownDevice(deviceType);

    const result = uut.resolve(device, opts);
    expect(result).toBeInstanceOf(MockExternalModuleExpect);
    expect(resolveModuleFromPath).toHaveBeenCalledWith(deviceType);
  });
});
