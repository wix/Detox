/**
 * @param deviceConfig
 * @returns {{ deviceAllocatorFactory: DeviceAllocatorFactory }}
 */
function createFactories(deviceConfig) {
  const {
    GenycloudEnvValidatorFactory,
    IosSimulatorEnvValidatorFactory,
    NoopEnvValidatorFactory,
  } = require('./validation/factories');

  const {
    AndroidArtifactsManagerFactory,
    IosArtifactsManagerFactory,
    IosSimulatorArtifactsManagerFactory,
  } = require('./artifacts/factories');

  const {
    GenycloudAllocatorFactory,
    AndroidEmulatorAllocatorFactory,
    AndroidAttachedAllocatorFactory,
    IosSimulatorAllocatorFactory,
  } = require('./devices/allocation/factories');

  const runtimeDeviceFactory = require('./devices/runtime/runtimeDeviceFactory');

  const {
    AndroidMatchersFactory,
    IosMatchersFactory,
  } = require('./matchers/factories');

  let envValidatorFactory;
  let artifactsManagerFactory;
  let deviceAllocatorFactory;
  let matchersFactory;
  switch (deviceConfig.type) {
    case 'android.emulator':
      envValidatorFactory = new NoopEnvValidatorFactory();
      artifactsManagerFactory = new AndroidArtifactsManagerFactory();
      deviceAllocatorFactory = new AndroidEmulatorAllocatorFactory();
      matchersFactory = new AndroidMatchersFactory();
      break;

    case 'android.genycloud':
      envValidatorFactory = new GenycloudEnvValidatorFactory();
      deviceAllocatorFactory = new GenycloudAllocatorFactory();
      artifactsManagerFactory = new AndroidArtifactsManagerFactory();
      matchersFactory = new AndroidMatchersFactory();
      break;

    case 'android.attached':
      envValidatorFactory = new NoopEnvValidatorFactory();
      deviceAllocatorFactory = new AndroidAttachedAllocatorFactory();
      artifactsManagerFactory = new AndroidArtifactsManagerFactory();
      matchersFactory = new AndroidMatchersFactory();
      break;

    case 'ios.simulator':
      envValidatorFactory = new IosSimulatorEnvValidatorFactory();
      deviceAllocatorFactory = new IosSimulatorAllocatorFactory();
      artifactsManagerFactory = new IosSimulatorArtifactsManagerFactory();
      matchersFactory = new IosMatchersFactory();
      break;

    case 'ios.none':
      // TODO ASDASD
      envValidatorFactory = new NoopEnvValidatorFactory();
      artifactsManagerFactory = new IosArtifactsManagerFactory();
      matchersFactory = new IosMatchersFactory();
      break;

    default:
      break; // TODO ASDASD resolveModuleFromPath etc.
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
  createFactories,
};
