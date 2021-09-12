const envValidationFactories = require('./validation/factories');
const artifactsManagerFactories = require('./artifacts/factories');
const deviceAllocationFactories = require('./devices/allocation/factories');
const matchersFactories = require('./matchers/factories');
const runtimeDeviceFactories = require('./devices/runtime/factories');
const resolveModuleFromPath = require('./utils/resolveModuleFromPath');

function validateConfig(deviceConfig) {
  switch (deviceConfig.type) {
    case 'android.emulator':
    case 'android.attached':
    case 'android.genycloud':
    case 'ios.simulator':
    case 'ios.none':
      break;

    default: {
      const modulePath = deviceConfig.type;
      const module = resolveModuleFromPath(modulePath);

      deviceAllocationFactories.ExternalFactory.validateConfig(module, modulePath);
      matchersFactories.ExternalFactory.validateConfig(module, modulePath);
      runtimeDeviceFactories.ExternalFactory.validateConfig(module, modulePath);
    }
  }
}

/**
 * @param deviceConfig
 * @returns {{ deviceAllocatorFactory: DeviceAllocatorFactoryBase }}
 */
function createFactories(deviceConfig) {
  let envValidatorFactory;
  let artifactsManagerFactory;
  let deviceAllocatorFactory;
  let matchersFactory;
  let runtimeDeviceFactory;

  switch (deviceConfig.type) {
    case 'android.emulator':
      envValidatorFactory = new envValidationFactories.NoopFactory();
      deviceAllocatorFactory = new deviceAllocationFactories.AndroidEmulatorFactory();
      artifactsManagerFactory = new artifactsManagerFactories.AndroidFactory();
      matchersFactory = new matchersFactories.AndroidFactory();
      runtimeDeviceFactory = new runtimeDeviceFactories.AndroidEmulatorFactory();
      break;

    case 'android.attached':
      envValidatorFactory = new envValidationFactories.NoopFactory();
      deviceAllocatorFactory = new deviceAllocationFactories.AttachedAndroidFactory();
      artifactsManagerFactory = new artifactsManagerFactories.AndroidFactory();
      matchersFactory = new matchersFactories.AndroidFactory();
      runtimeDeviceFactory = new runtimeDeviceFactories.AttachedAndroidFactory();
      break;

    case 'android.genycloud':
      envValidatorFactory = new envValidationFactories.GenycloudFactory();
      deviceAllocatorFactory = new deviceAllocationFactories.GenycloudFactory();
      artifactsManagerFactory = new artifactsManagerFactories.AndroidFactory();
      matchersFactory = new matchersFactories.AndroidFactory();
      runtimeDeviceFactory = new runtimeDeviceFactories.GenycloudFactory();
      break;

    case 'ios.simulator':
      envValidatorFactory = new envValidationFactories.IosSimulatorFactory();
      deviceAllocatorFactory = new deviceAllocationFactories.IosSimulatorFactory();
      artifactsManagerFactory = new artifactsManagerFactories.IosSimulatorFactory();
      matchersFactory = new matchersFactories.IosFactory();
      runtimeDeviceFactory = new runtimeDeviceFactories.IosSimulatorFactory();
      break;

    case 'ios.none':
      // TODO ASDASD
      envValidatorFactory = new envValidationFactories.NoopFactory();
      artifactsManagerFactory = new artifactsManagerFactories.IosFactory();
      matchersFactory = new matchersFactories.IosFactory();
      runtimeDeviceFactory = new runtimeDeviceFactories.IosFactory();
      break;

    default: {
      const modulePath = deviceConfig.type;
      const module = resolveModuleFromPath(modulePath);

      envValidatorFactory = new envValidationFactories.ExternalFactory(module);
      deviceAllocatorFactory = new deviceAllocationFactories.ExternalFactory(module);
      artifactsManagerFactory = new artifactsManagerFactories.ExternalFactory(module);
      matchersFactory = new matchersFactories.ExternalFactory(module, modulePath);
      runtimeDeviceFactory = new runtimeDeviceFactories.ExternalFactory(module, modulePath);
      break;
    }
  }

  return {
    envValidatorFactory,
    artifactsManagerFactory,
    deviceAllocatorFactory,
    runtimeDeviceFactory,
    matchersFactory,
  }
}

module.exports = {
  validateConfig,
  createFactories,
};
