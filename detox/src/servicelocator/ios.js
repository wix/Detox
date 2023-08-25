const DeviceRegistry = require('../devices/allocation/DeviceRegistry');
const AppleSimUtils = require('../devices/common/drivers/ios/tools/AppleSimUtils');
const environment = require('../utils/environment');

module.exports = {
  appleSimUtils: new AppleSimUtils(),
  deviceRegistry: new DeviceRegistry({
    lockfilePath: environment.getDeviceLockFilePathIOS(),
  }),
};
