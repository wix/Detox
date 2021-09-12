const ADB = require('../../devices/common/drivers/android/exec/ADB');
const AAPT = require('../../devices/common/drivers/android/exec/AAPT');
const TempFileXfer = require('../../devices/common/drivers/android/tools/TempFileXfer');
const DeviceRegistry = require('../../devices/DeviceRegistry');
const AndroidDevicePathBuilder = require('../../artifacts/utils/AndroidDevicePathBuilder');

class AndroidServiceLocator {
  static adb = new ADB();
  static aapt = new AAPT();
  static fileXfer = new TempFileXfer(AndroidServiceLocator.adb);
  static deviceRegistry = DeviceRegistry.forAndroid();
  static devicePathBuilder = new AndroidDevicePathBuilder();

  static get emulator() {
    return require('./emulatorServiceLocator');
  }

  static get genycloud() {
    return require('./genycloudServiceLocator');
  }
}

module.exports = AndroidServiceLocator;
