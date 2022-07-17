const AndroidDevicePathBuilder = require('../../artifacts/utils/AndroidDevicePathBuilder');
const DeviceRegistry = require('../../devices/DeviceRegistry');
const AAPT = require('../../devices/common/drivers/android/exec/AAPT');
const ADB = require('../../devices/common/drivers/android/exec/ADB');
const ApkValidator = require('../../devices/common/drivers/android/tools/ApkValidator');
const HashHelper = require('../../devices/common/drivers/android/tools/HashHelper');
const { TempFileTransfer } = require('../../devices/common/drivers/android/tools/TempFileTransfer');

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
AndroidServiceLocator.tempFileTransfer = new TempFileTransfer(AndroidServiceLocator.adb);
AndroidServiceLocator.deviceRegistry = DeviceRegistry.forAndroid();
AndroidServiceLocator.devicePathBuilder = new AndroidDevicePathBuilder();
AndroidServiceLocator.hashHelper = new HashHelper(AndroidServiceLocator.adb, AndroidServiceLocator.tempFileTransfer);


module.exports = AndroidServiceLocator;
