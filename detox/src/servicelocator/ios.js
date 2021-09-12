const AppleSimUtils = require('../devices/common/drivers/ios/tools/AppleSimUtils');
const DeviceRegistry = require('../devices/DeviceRegistry');

class IosServiceLocator {
  static appleSimUtils = new AppleSimUtils();
  static deviceRegistry = DeviceRegistry.forIOS();
}

module.exports = IosServiceLocator;
