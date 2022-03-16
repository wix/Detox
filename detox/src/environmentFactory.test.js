describe('Main environment factory', () => {
  const mockFakeModule = {
    fake: 'module',
  };

  let deviceAllocationFactories;
  let matchersFactories;
  let runtimeDeviceFactories;
  let environmentFactory;
  beforeEach(() => {
    jest.mock('./devices/allocation/factories');
    deviceAllocationFactories = require('./devices/allocation/factories');

    jest.mock('./matchers/factories');
    matchersFactories = require('./matchers/factories');

    jest.mock('./devices/runtime/factories');
    runtimeDeviceFactories = require('./devices/runtime/factories');

    jest.mock('./utils/resolveModuleFromPath', () => () => mockFakeModule);

    environmentFactory = require('./environmentFactory');
  });

  describe('validation', () => {
    [
      'ios.none',
      'ios.simulator',
      'android.attached',
      'android.emulator',
      'android.genycloud',
    ].forEach((type) => {
      it(`should confirm known type ${type}`, () => {
        const deviceConfig = {
          type,
        };
        environmentFactory.validateConfig(deviceConfig);
      });
    });

    it('should try to validate assuming the type is a node.js dependency', () => {
      const fakeType = 'fake.type';
      const deviceConfig = {
        type: fakeType,
      };
      environmentFactory.validateConfig(deviceConfig);
      expect(deviceAllocationFactories.External.validateModule).toHaveBeenCalledWith(mockFakeModule, 'fake.type');
      expect(matchersFactories.External.validateModule).toHaveBeenCalledWith(mockFakeModule, 'fake.type');
      expect(runtimeDeviceFactories.External.validateModule).toHaveBeenCalledWith(mockFakeModule, 'fake.type');
    });
  });
});
