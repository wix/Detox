const resolveModuleFromPath = require('../utils/resolveModuleFromPath');

class DriverRegistry {
  constructor(deviceClasses) {
    this.deviceClasses = deviceClasses;
  }

  resolve(deviceType, opts) {
    let DeviceDriverClass = this.deviceClasses[deviceType];

    if (!DeviceDriverClass) {
      try {
        DeviceDriverClass = resolveModuleFromPath(deviceType);
      } catch (e) {
        // noop, if we don't find a module to require, we'll hit the unsupported error below
      }
    }

    if (!DeviceDriverClass) {
      throw new Error(`'${deviceType}' is not supported`);
    }

    return new DeviceDriverClass(opts);
  }
}

DriverRegistry.default = new DriverRegistry({
  'ios.none': require('./drivers/ios/IosDriver'),
  'ios.simulator': require('./drivers/ios/SimulatorDriver'),
  'android.emulator': require('./drivers/android/EmulatorDriver'),
  'android.attached': require('./drivers/android/AttachedAndroidDriver'),
});

module.exports = DriverRegistry;