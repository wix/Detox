const LazyRef = require('../utils/LazyRef');

class IosServiceLocator {
  static _appleSimUtils = new LazyRef(() => {
    const AppleSimUtils = require('../devices/common/drivers/ios/tools/AppleSimUtils');
    return new AppleSimUtils();
  });

  static _deviceRegistry = new LazyRef(() => {
    const DeviceRegistry = require('../devices/DeviceRegistry');
    return DeviceRegistry.forIOS();
  });

  static appleSimUtils() {
    return IosServiceLocator._appleSimUtils.ref;
  }

  static deviceRegistry() {
    return IosServiceLocator._deviceRegistry.ref;
  }
}

module.exports = IosServiceLocator;
