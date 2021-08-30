const LazyRef = require('../utils/LazyRef');
const environment = require('../utils/environment');

class EmulatorServiceLocator {
  static _emulatorExec = new LazyRef(() => {
    const { EmulatorExec } = require('../devices/common/drivers/android/emulator/exec/EmulatorExec');
    return new EmulatorExec();
  });

  static exec() {
    return EmulatorServiceLocator._emulatorExec.ref;
  }
}

class GenycloudServiceLocator {
  static _genycloudExec = new LazyRef(() => {
    const Exec = require('../devices/common/drivers/android/genycloud/exec/GenyCloudExec')
    return new Exec(environment.getGmsaasPath())
  });

  static _runtimedeviceRegistry = new LazyRef(() => {
    const DeviceRegistryFactory = require('../devices/runtime/drivers/android/genycloud/GenyDeviceRegistryFactory');
    return DeviceRegistryFactory.forRuntime();
  });

  static _cleanupdeviceRegistry = new LazyRef(() => {
    const DeviceRegistryFactory = require('../devices/runtime/drivers/android/genycloud/GenyDeviceRegistryFactory');
    return DeviceRegistryFactory.forGlobalShutdown();
  });

  static exec() {
    return GenycloudServiceLocator._genycloudExec.ref;
  }

  static runtimeDeviceRegistry() {
    return GenycloudServiceLocator._runtimedeviceRegistry.ref;
  }

  static cleanupDeviceRegistry() {
    return GenycloudServiceLocator._cleanupdeviceRegistry.ref;
  }
}

class AndroidServiceLocator {
  static _adb = new LazyRef(() => {
    const ADB = require('../devices/common/drivers/android/exec/ADB');
    return new ADB();
  });

  static _aapt = new LazyRef(() => {
    const AAPT = require('../devices/common/drivers/android/exec/AAPT');
    return new AAPT();
  });

  static _fileXFer = new LazyRef(() => {
    const TempFileXfer = require('../devices/common/drivers/android/tools/TempFileXfer');
    return new TempFileXfer(AndroidServiceLocator.adb());
  });

  static _deviceRegistry = new LazyRef(() => {
    const DeviceRegistry = require('../devices/DeviceRegistry');
    return DeviceRegistry.forAndroid();
  });

  static _devicePathBuilder = new LazyRef(() => {
    const AndroidDevicePathBuilder = require('../artifacts/utils/AndroidDevicePathBuilder');
    return new AndroidDevicePathBuilder();
  });

  static adb() {
    return AndroidServiceLocator._adb.ref;
  }

  static aapt() {
    return AndroidServiceLocator._aapt.ref;
  }

  static fileXfer() {
    return AndroidServiceLocator._fileXFer.ref;
  }

  static deviceRegistry() {
    return AndroidServiceLocator._deviceRegistry.ref;
  }

  static devicePathBuilder() {
    return AndroidServiceLocator._devicePathBuilder.ref;
  }

  static emulator = EmulatorServiceLocator;
  static genycloud = GenycloudServiceLocator;
}

module.exports = AndroidServiceLocator;
