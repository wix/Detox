const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const resolveModuleFromPath = require('../utils/resolveModuleFromPath');

// TODO ASDASD Keep or delete?
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
  'ios.none': require('./runtime/drivers/ios/IosDriver'), // TODO ASDASD
  'ios.simulator': require('./runtime/drivers/ios/SimulatorDriver'),
  'android.emulator': require('./runtime/drivers/android/emulator/EmulatorDriver'),
  'android.attached': require('./runtime/drivers/android/attached/AttachedAndroidDriver'),
  'android.genycloud': require('./runtime/drivers/android/genycloud/GenyCloudDriver'),
});

module.exports = DriverRegistry;
