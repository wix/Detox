const envValidationFactories = require('./validation/factories');
const artifactsManagerFactories = require('./artifacts/factories');
const deviceAllocationFactories = require('./devices/allocation/factories');
const matchersFactories = require('./matchers/factories');
const runtimeDeviceFactories = require('./devices/runtime/factories');
const resolveModuleFromPath = require('./utils/resolveModuleFromPath');

function validateConfig(deviceConfig) {
  const classes = _getFactoryClasses(deviceConfig);
  if (!classes) {
    const modulePath = deviceConfig.type;
    const module = resolveModuleFromPath(modulePath);

    deviceAllocationFactories.ExternalFactory.validateModule(module, modulePath);
    matchersFactories.ExternalFactory.validateModule(module, modulePath);
    runtimeDeviceFactories.ExternalFactory.validateModule(module, modulePath);
  }
}

/**
 * @param deviceConfig
 * @returns {{ deviceAllocatorFactory: DeviceAllocatorFactoryBase }}
 */
function createFactories(deviceConfig) {
  const classes = _getFactoryClasses(deviceConfig);
  if (classes) {
    return {
      envValidatorFactory: new classes.envValidatorFactoryClass(),
      artifactsManagerFactory: new classes.artifactsManagerFactoryClass(),
      deviceAllocatorFactory: new classes.deviceAllocatorFactoryClass(),
      matchersFactory: new classes.matchersFactoryClass(),
      runtimeDeviceFactory: new classes.runtimeDeviceFactoryClass(),
    }
  }
  return _getExternalModuleFactories(deviceConfig);
}

function _getFactoryClasses(deviceConfig) {
  let envValidatorFactoryClass;
  let artifactsManagerFactoryClass;
  let deviceAllocatorFactoryClass;
  let matchersFactoryClass;
  let runtimeDeviceFactoryClass;

  switch (deviceConfig.type) {
    case 'android.emulator':
      envValidatorFactoryClass = envValidationFactories.NoopFactory;
      deviceAllocatorFactoryClass = deviceAllocationFactories.AndroidEmulatorFactory;
      artifactsManagerFactoryClass = artifactsManagerFactories.AndroidFactory;
      matchersFactoryClass = matchersFactories.AndroidFactory;
      runtimeDeviceFactoryClass = runtimeDeviceFactories.AndroidEmulatorFactory;
      break;

    case 'android.attached':
      envValidatorFactoryClass = envValidationFactories.NoopFactory;
      deviceAllocatorFactoryClass = deviceAllocationFactories.AttachedAndroidFactory;
      artifactsManagerFactoryClass = artifactsManagerFactories.AndroidFactory;
      matchersFactoryClass = matchersFactories.AndroidFactory;
      runtimeDeviceFactoryClass = runtimeDeviceFactories.AttachedAndroidFactory;
      break;

    case 'android.genycloud':
      envValidatorFactoryClass = envValidationFactories.GenycloudFactory;
      deviceAllocatorFactoryClass = deviceAllocationFactories.GenycloudFactory;
      artifactsManagerFactoryClass = artifactsManagerFactories.AndroidFactory;
      matchersFactoryClass = matchersFactories.AndroidFactory;
      runtimeDeviceFactoryClass = runtimeDeviceFactories.GenycloudFactory;
      break;

    case 'ios.simulator':
      envValidatorFactoryClass = envValidationFactories.IosSimulatorFactory;
      deviceAllocatorFactoryClass = deviceAllocationFactories.IosSimulatorFactory;
      artifactsManagerFactoryClass = artifactsManagerFactories.IosSimulatorFactory;
      matchersFactoryClass = matchersFactories.IosFactory;
      runtimeDeviceFactoryClass = runtimeDeviceFactories.IosSimulatorFactory;
      break;

    case 'ios.none':
      envValidatorFactoryClass = envValidationFactories.NoopFactory;
      deviceAllocatorFactoryClass = deviceAllocationFactories.NoneDeviceFactory;
      artifactsManagerFactoryClass = artifactsManagerFactories.IosFactory;
      matchersFactoryClass = matchersFactories.IosFactory;
      runtimeDeviceFactoryClass = runtimeDeviceFactories.IosFactory;
      break;

    default: {
      return null;
    }
  }

  return {
    envValidatorFactoryClass,
    artifactsManagerFactoryClass,
    deviceAllocatorFactoryClass,
    matchersFactoryClass,
    runtimeDeviceFactoryClass,
  }
}

function _getExternalModuleFactories(deviceConfig) {
  const modulePath = deviceConfig.type;
  const module = resolveModuleFromPath(modulePath);

  return {
    envValidatorFactory: new envValidationFactories.ExternalFactory(module),
    deviceAllocatorFactory: new deviceAllocationFactories.ExternalFactory(module),
    artifactsManagerFactory: new artifactsManagerFactories.ExternalFactory(module),
    matchersFactory: new matchersFactories.ExternalFactory(module, modulePath),
    runtimeDeviceFactory: new runtimeDeviceFactories.ExternalFactory(module, modulePath),
  }
}

module.exports = {
  validateConfig,
  createFactories,
};
