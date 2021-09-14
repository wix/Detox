const DeviceRegistry = require('../devices/DeviceRegistry');
const AppleSimUtils = require('../devices/common/drivers/ios/tools/AppleSimUtils');

module.exports = {
  appleSimUtils: new AppleSimUtils(),
  deviceRegistry: DeviceRegistry.forIOS(),
};
