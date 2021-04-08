const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const resolveModuleFromPath = require('../utils/resolveModuleFromPath');

class DriverRegistry {
  constructor(deviceClasses) {
    this.deviceClasses = deviceClasses;
  }

  resolve(deviceType) {
    let DeviceDriverClass = this.deviceClasses[deviceType];

    if (!DeviceDriverClass) {
      DeviceDriverClass = resolveModuleFromPath(deviceType).DriverClass;

      if (!DeviceDriverClass) {
        throw new DetoxRuntimeError(`The custom driver '${deviceType}' does not export DriverClass property`);
      }
    }

    return DeviceDriverClass;
  }
}

DriverRegistry.default = new DriverRegistry({
  'ios.none': require('./drivers/ios/IosDriver'),
  'ios.simulator': require('./drivers/ios/SimulatorDriver'),
  'android.emulator': require('./drivers/android/emulator/EmulatorDriver'),
  'android.attached': require('./drivers/android/attached/AttachedAndroidDriver'),
  'android.genycloud': require('./drivers/android/genycloud/GenyCloudDriver'),
});

module.exports = DriverRegistry;
