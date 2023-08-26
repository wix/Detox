const AndroidDevicePathBuilder = require('../../../artifacts/utils/AndroidDevicePathBuilder');
const AAPT = require('../../common/drivers/android/exec/AAPT');
const ADB = require('../../common/drivers/android/exec/ADB');
const ApkValidator = require('../../common/drivers/android/tools/ApkValidator');
const { TempFileTransfer } = require('../../common/drivers/android/tools/TempFileTransfer');

const AndroidServiceLocator = {
  get emulator() {
    return require('./emulatorServiceLocator');
  },

  get genycloud() {
    return require('./genycloudServiceLocator');
  },
};

AndroidServiceLocator.adb = new ADB();
AndroidServiceLocator.aapt = new AAPT();
AndroidServiceLocator.apkValidator = new ApkValidator(AndroidServiceLocator.aapt);
AndroidServiceLocator.fileTransfer = new TempFileTransfer(AndroidServiceLocator.adb);
AndroidServiceLocator.devicePathBuilder = new AndroidDevicePathBuilder();

module.exports = AndroidServiceLocator;
