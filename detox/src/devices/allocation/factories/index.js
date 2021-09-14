const DeviceAllocatorFactoryBase = require('./DeviceAllocatorFactoryBase');
const {
  AndroidEmulatorAllocDriverFactory,
  AttachedAndroidAllocDriverFactory,
  GenycloudAllocDriverFactory,
  IosSimulatorAllocDriverFactory,
  ExternalAllocDriverFactory,
  NoneAllocDriverFactory,
} = require('./drivers');

class AndroidEmulatorFactory extends DeviceAllocatorFactoryBase {
  constructor() {
    super(new AndroidEmulatorAllocDriverFactory());
  }
}

class AttachedAndroidFactory extends DeviceAllocatorFactoryBase {
  constructor() {
    super(new AttachedAndroidAllocDriverFactory());
  }
}

class GenycloudFactory extends DeviceAllocatorFactoryBase {
  constructor() {
    super(new GenycloudAllocDriverFactory());
  }
}

class IosSimulatorFactory extends DeviceAllocatorFactoryBase {
  constructor() {
    super(new IosSimulatorAllocDriverFactory());
  }
}

class ExternalFactory extends DeviceAllocatorFactoryBase {
  static validateModule(module, path) {
    ExternalAllocDriverFactory.validateModule(module, path);
  }

  constructor(module, path) {
    super(new ExternalAllocDriverFactory(module, path));
  }
}

class NoneDeviceFactory extends DeviceAllocatorFactoryBase {
  constructor() {
    super(new NoneAllocDriverFactory());
  }
}

module.exports = {
  AndroidEmulatorFactory,
  AttachedAndroidFactory,
  GenycloudFactory,
  IosSimulatorFactory,
  ExternalFactory,
  NoneDeviceFactory,
};
