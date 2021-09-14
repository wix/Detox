const _ = require('lodash');

const { AllocationDriverBase, DeallocationDriverBase } = require('../../AllocationDriverBase');
const { patchAvdSkinConfig } = require('./patchAvdSkinConfig');
const { traceCall } = require('../../../../../utils/trace');

const AndroidEmulatorCookie = require('../../../../cookies/AndroidEmulatorCookie');

class EmulatorAllocDriver extends AllocationDriverBase {

  /**
   * @param adb { ADB }
   * @param avdValidator { AVDValidator }
   * @param emulatorVersionResolver { EmulatorVersionResolver }
   * @param emulatorLauncher { EmulatorLauncher }
   * @param allocationHelper { EmulatorAllocationHelper }
   */
  constructor({ adb, avdValidator, emulatorVersionResolver, emulatorLauncher, allocationHelper }) {
    super();
    this._adb = adb;
    this._avdValidator = avdValidator;
    this._emulatorVersionResolver = emulatorVersionResolver;
    this._emulatorLauncher = emulatorLauncher;
    this._allocationHelper = allocationHelper;
  }

  /**
   * @param deviceQuery
   * @returns {Promise<AndroidEmulatorCookie>}
   */
  async allocate(deviceQuery) {
    const avdName = _.isPlainObject(deviceQuery) ? deviceQuery.avdName : deviceQuery;

    await this._avdValidator.validate(avdName);
    await this._fixAvdConfigIniSkinNameIfNeeded(avdName);

    const allocResult = await this._allocationHelper.allocateDevice(avdName);
    const { adbName, placeholderPort, isRunning } = allocResult;

    await this._launchEmulator(avdName, adbName, isRunning, placeholderPort);
    await this._prepareEmulator(adbName);

    return new AndroidEmulatorCookie(adbName, avdName);
  }

  async _fixAvdConfigIniSkinNameIfNeeded(avdName) {
    const rawBinaryVersion = await this._emulatorVersionResolver.resolve();
    const binaryVersion = _.get(rawBinaryVersion, 'major');
    return await patchAvdSkinConfig(avdName, binaryVersion);
  }

  async _launchEmulator(avdName, adbName, isRunning, port) {
    try {
      await traceCall('emulatorLaunch', () =>
        this._emulatorLauncher.launch(avdName, adbName, isRunning, { port }));
    } catch (e) {
      await this._allocationHelper.deallocateDevice(adbName);
      throw e;
    }
  }

  async _prepareEmulator(adbName) {
    await this._adb.apiLevel(adbName);
    await this._adb.disableAndroidAnimations(adbName);
    await this._adb.unlockScreen(adbName);
  }
}

class EmulatorDeallocDriver extends DeallocationDriverBase {
  /**
   * @param adbName { String }
   * @param emulatorLauncher { EmulatorLauncher }
   * @param allocationHelper { EmulatorAllocationHelper }
   */
  constructor(adbName, { emulatorLauncher, allocationHelper }) {
    super();
    this._adbName = adbName;
    this._emulatorLauncher = emulatorLauncher;
    this._allocationHelper = allocationHelper;
  }

  /**
   * @param options { {shutdown: boolean} }
   * @return {Promise<void>}
   */
  async free(options = {}) {
    await this._allocationHelper.deallocateDevice(this._adbName);

    if (options.shutdown) {
      await this._emulatorLauncher.shutdown(this._adbName);
    }
  }
}

module.exports = {
  EmulatorAllocDriver,
  EmulatorDeallocDriver,
};
