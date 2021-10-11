const AndroidDevicePathBuilder = require('../../artifacts/utils/AndroidDevicePathBuilder');
const DeviceRegistry = require('../../devices/DeviceRegistry');
const AAPT = require('../../devices/common/drivers/android/exec/AAPT');
const ADB = require('../../devices/common/drivers/android/exec/ADB');
const TempFileXfer = require('../../devices/common/drivers/android/tools/TempFileXfer');

class AndroidServiceLocator {
  static get emulator() {
    return require('./emulatorServiceLocator');
  }

  static get genycloud() {
    return require('./genycloudServiceLocator');
  }
}

AndroidServiceLocator.adb = new ADB();
AndroidServiceLocator.aapt = new AAPT();
AndroidServiceLocator.fileXfer = new TempFileXfer(AndroidServiceLocator.adb);
AndroidServiceLocator.deviceRegistry = DeviceRegistry.forAndroid();
AndroidServiceLocator.devicePathBuilder = new AndroidDevicePathBuilder();

module.exports = AndroidServiceLocator;
