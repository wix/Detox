const _ = require('lodash');

const AllocationDriverBase = require('../AllocationDriverBase');
const { patchAvdSkinConfig } = require('./patchAvdSkinConfig');
const { traceCall } = require('../../../../utils/trace');
const AndroidEmulatorCookie = require('../../../cookies/AndroidEmulatorCookie');

class EmulatorAllocDriver extends AllocationDriverBase {

  /**
   * @param adb { ADB }
   * @param eventEmitter { AsyncEmitter }
   * @param avdValidator { AVDValidator }
   * @param emulatorVersionResolver { EmulatorVersionResolver }
   * @param emulatorLauncher { EmulatorLauncher }
   * @param deviceAllocation { EmulatorDeviceAllocation }
   */
  constructor({ adb, eventEmitter, avdValidator, emulatorVersionResolver, emulatorLauncher, deviceAllocation }) {
    super(eventEmitter);
    this._adb = adb;
    this._avdValidator = avdValidator;
    this._emulatorVersionResolver = emulatorVersionResolver;
    this._emulatorLauncher = emulatorLauncher;
    this._deviceAllocation = deviceAllocation;
  }

  /**
   * @param deviceQuery
   * @returns {Promise<AndroidEmulatorCookie>}
   */
  async allocate(deviceQuery) {
    const avdName = _.isPlainObject(deviceQuery) ? deviceQuery.avdName : deviceQuery;

    await this._avdValidator.validate(avdName);
    await this._fixAvdConfigIniSkinNameIfNeeded(avdName);

    const allocResult = await this._deviceAllocation.allocateDevice(avdName);
    const { adbName, placeholderPort } = allocResult;

    if (!allocResult.isRunning) {
      await this._launchEmulator(avdName, adbName, placeholderPort)
    }
    await this._notifyBootEvent(adbName, avdName, !allocResult.isRunning);
    await this._prepareEmulator(adbName);

    return new AndroidEmulatorCookie(adbName, avdName);
  }

  /**
   * @param deviceCookie { AndroidEmulatorCookie }
   * @param options { {shutdown: boolean} }
   * @return {Promise<void>}
   */
  async free(deviceCookie, options = {}) {
    await this._deviceAllocation.deallocateDevice(deviceCookie.adbName);

    if (options.shutdown) {
      await this._emulatorLauncher.shutdown(deviceCookie.adbName);
    }
  }

  async _fixAvdConfigIniSkinNameIfNeeded(avdName) {
    const rawBinaryVersion = await this._emulatorVersionResolver.resolve();
    const binaryVersion = _.get(rawBinaryVersion, 'major');
    return await patchAvdSkinConfig(avdName, binaryVersion);
  }

  async _launchEmulator(avdName, adbName, port) {
    try {
      await traceCall('emulatorLaunch', () =>
        this._emulatorLauncher.launch(avdName, adbName, { port }));
    } catch (e) {
      await this._deviceAllocation.deallocateDevice(adbName);
      throw e;
    }
  }

  async _prepareEmulator(adbName) {
    await this._adb.apiLevel(adbName);
    await this._adb.disableAndroidAnimations(adbName);
    await this._adb.unlockScreen(adbName);
  }
}

module.exports = EmulatorAllocDriver;
