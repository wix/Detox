const _ = require('lodash');
const AndroidDriver = require('./AndroidDriver');
const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');
const DeviceRegistry = require('../../DeviceRegistry');
const environment = require('../../../utils/environment');
const log = require('../../../utils/logger').child({ __filename });
const ALLOCATE_DEVICE_LOG_EVT = 'ALLOCATE_DEVICE';

class AttachedAndroidDriver extends AndroidDriver {

  constructor(config) {
    super(config);

    this.deviceRegistry = new DeviceRegistry({
      lockfilePath: environment.getDeviceLockFilePathAndroid()
    });

    this._name = 'Unnamed Android Device';
  }

  get name() {
    return this._name;
  }

  async acquireFreeDevice(deviceQuery) {
    const adbName = await this._allocateDevice(deviceQuery);

    await this.adb.apiLevel(adbName);
    await this.adb.unlockScreen(adbName);
    this._name = adbName;

    return adbName;
  }

  async cleanup(adbName, bundleId) {
    await this.deviceRegistry.disposeDevice(adbName);
    await super.cleanup(adbName, bundleId);
  }

  async _allocateDevice(deviceQuery) {
    const adbNameVal = _.isPlainObject(deviceQuery) ? deviceQuery.adbName : deviceQuery;

    if (_.isArray(adbNameVal)) {
      log.debug({ event: ALLOCATE_DEVICE_LOG_EVT }, `Trying to allocate a device based on the provided list: ${adbNameVal.join(', ')}`);
      const adbName = await this.deviceRegistry.allocateDevice(() => this._doAllocateDevice(adbNameVal));

      if (!adbName) {
        await this._throwCouldNotFindDevice(adbNameVal);
      }

      log.debug({ event: ALLOCATE_DEVICE_LOG_EVT }, `Settled on ${adbName}`);
      return adbName;
    }

    const { devices } = await this.adb.devices();

    if (!devices.some((d) => d.adbName === adbNameVal)) {
      await this._throwCouldNotFindDevice(adbNameVal);
    }

    return adbNameVal;
  }

  async _doAllocateDevice(adbNameList) {
    const { devices } = await this.adb.devices();
    for (const candidate of devices) {
      const isBusy = this.deviceRegistry.isDeviceBusy(candidate.adbName);
      if (!isBusy && adbNameList.includes(candidate.adbName)) {
        log.debug({ event: ALLOCATE_DEVICE_LOG_EVT }, `Found ${candidate.adbName}!`);
        return candidate.adbName;
      }
    }
  }

  async _throwCouldNotFindDevice(adbName) {
    const { stdout } = await this.adb.devices();
    throw new DetoxRuntimeError({
      message: `Could not find '${adbName}' on the currently ADB attached devices:`,
      debugInfo: stdout,
      hint: `Make sure your device is connected.\n` + `You can also try restarting adb with 'adb kill-server && adb start-server'.`,
      inspectOptions: undefined
    });
  }
}

module.exports = AttachedAndroidDriver;
