const LazyRef = require('../utils/LazyRef');

const appleSimUtils = new LazyRef(() => {
  const AppleSimUtils = require('../devices/common/drivers/ios/tools/AppleSimUtils');
  return new AppleSimUtils();
});

const deviceRegistry = new LazyRef(() => {
  const DeviceRegistry = require('../devices/DeviceRegistry');
  return DeviceRegistry.forIOS();
});

class IosServiceLocator {
  get appleSimUtils() {
    return appleSimUtils.ref;
  }

  get deviceRegistry() {
    return deviceRegistry.ref;
  }
}

module.exports = IosServiceLocator;
