// @ts-nocheck
const artifactsManagerFactories = require('./artifacts/factories');
const deviceAllocationFactories = require('./devices/allocation/factories');
const runtimeDeviceFactories = require('./devices/runtime/factories');
const envValidationFactories = require('./devices/validation/factories');
const matchersFactories = require('./matchers/factories');
const resolveModuleFromPath = require('./utils/resolveModuleFromPath');

function validateConfig(deviceConfig) {
  const classes = _getFactoryClasses(deviceConfig);
  if (!classes) {
    const modulePath = deviceConfig.type;
    const module = resolveModuleFromPath(modulePath);

    deviceAllocationFactories.External.validateModule(module, modulePath);
    matchersFactories.External.validateModule(module, modulePath);
    runtimeDeviceFactories.External.validateModule(module, modulePath);
  }
}

/**
 * @param deviceConfig
 * @returns {{ deviceAllocatorFactory: DeviceAllocatorFactory }}
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
    };
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
      envValidatorFactoryClass = envValidationFactories.Noop;
      deviceAllocatorFactoryClass = deviceAllocationFactories.AndroidEmulator;
      artifactsManagerFactoryClass = artifactsManagerFactories.Android;
      matchersFactoryClass = matchersFactories.Android;
      runtimeDeviceFactoryClass = runtimeDeviceFactories.AndroidEmulator;
      break;

    case 'android.attached':
      envValidatorFactoryClass = envValidationFactories.Noop;
      deviceAllocatorFactoryClass = deviceAllocationFactories.AndroidAttached;
      artifactsManagerFactoryClass = artifactsManagerFactories.Android;
      matchersFactoryClass = matchersFactories.Android;
      runtimeDeviceFactoryClass = runtimeDeviceFactories.AndroidAttached;
      break;

    case 'android.genycloud':
      envValidatorFactoryClass = envValidationFactories.Genycloud;
      deviceAllocatorFactoryClass = deviceAllocationFactories.Genycloud;
      artifactsManagerFactoryClass = artifactsManagerFactories.Android;
      matchersFactoryClass = matchersFactories.Android;
      runtimeDeviceFactoryClass = runtimeDeviceFactories.Genycloud;
      break;

    case 'ios.simulator':
      envValidatorFactoryClass = envValidationFactories.IosSimulator;
      deviceAllocatorFactoryClass = deviceAllocationFactories.IosSimulator;
      artifactsManagerFactoryClass = artifactsManagerFactories.IosSimulator;
      matchersFactoryClass = matchersFactories.Ios;
      runtimeDeviceFactoryClass = runtimeDeviceFactories.IosSimulator;
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
  };
}

function _getExternalModuleFactories(deviceConfig) {
  const modulePath = deviceConfig.type;
  const module = resolveModuleFromPath(modulePath);

  return {
    envValidatorFactory: new envValidationFactories.External(module),
    deviceAllocatorFactory: new deviceAllocationFactories.External(module),
    artifactsManagerFactory: new artifactsManagerFactories.External(module),
    matchersFactory: new matchersFactories.External(module, modulePath),
    runtimeDeviceFactory: new runtimeDeviceFactories.External(module, modulePath),
  };
}

module.exports = {
  validateConfig,
  createFactories,
};
