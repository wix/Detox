const _ = require('lodash');

const environment = require('../../../../../utils/environment');

const latestInstanceOf = (clazz) => _.last(clazz.mock.instances);

describe('Genymotion-cloud device-registries factory', () => {
  let DeviceRegistry;
  let GenyDeviceRegistryFactory;
  beforeEach(() => {
    jest.mock('../../../../DeviceRegistry');
    DeviceRegistry = require('../../../../DeviceRegistry');

    GenyDeviceRegistryFactory = require('./GenyDeviceRegistryFactory');
  });

  it('should expose method for runtime registry creation', () => {
    const androidDeviceRegistry = new DeviceRegistry();
    DeviceRegistry.forAndroid.mockReturnValue(androidDeviceRegistry);

    const result = GenyDeviceRegistryFactory.forRuntime();
    expect(result).toEqual(androidDeviceRegistry);
  });

  it('should expose method for genymotion clean-up registry creation', () => {
    const result = GenyDeviceRegistryFactory.forGlobalShutdown();
    expect(DeviceRegistry).toHaveBeenCalledWith({
      lockfilePath: environment.getGenyCloudGlobalCleanupFilePath(),
    });
    expect(result).toBeInstanceOf(DeviceRegistry);
    expect(result).toEqual(latestInstanceOf(DeviceRegistry));
  });

});
