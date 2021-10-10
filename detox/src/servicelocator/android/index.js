// TODO ASDASD Revisit whether LazyRef could be deleted altogether, relying on node's lazy loading

const LazyRef = require('../../utils/LazyRef');

const adb = new LazyRef(() => {
  const ADB = require('../../devices/common/drivers/android/exec/ADB');
  return new ADB();
});

const aapt = new LazyRef(() => {
  const AAPT = require('../../devices/common/drivers/android/exec/AAPT');
  return new AAPT();
});

const fileXfer = new LazyRef(() => {
  const TempFileXfer = require('../../devices/common/drivers/android/tools/TempFileXfer');
  return new TempFileXfer(adb.ref);
});

const deviceRegistry = new LazyRef(() => {
  const DeviceRegistry = require('../../devices/DeviceRegistry');
  return DeviceRegistry.forAndroid();
});

const devicePathBuilder = new LazyRef(() => {
  const AndroidDevicePathBuilder = require('../../artifacts/utils/AndroidDevicePathBuilder');
  return new AndroidDevicePathBuilder();
});

class AndroidServiceLocator {
  static get adb() {
    return adb.ref;
  }

  static get aapt() {
    return aapt.ref;
  }

  static get fileXfer() {
    return fileXfer.ref;
  }

  static get deviceRegistry() {
    return deviceRegistry.ref;
  }

  static get devicePathBuilder() {
    return devicePathBuilder.ref;
  }

  static get emulator() {
    return require('./emulatorServiceLocator');
  }

  static get genycloud() {
    return require('./genycloudServiceLocator');
  }
}

module.exports = AndroidServiceLocator;
