const DeviceLauncher = require('../../../../common/drivers/DeviceLauncher');

class AttachedAndroidLauncher extends DeviceLauncher {
  constructor(eventEmitter) {
    super(eventEmitter);
  }

  notifyLaunchCompleted(adbName) {
    return super._notifyBootEvent(adbName, 'device', false);
  }
}

module.exports = AttachedAndroidLauncher;
