// @ts-nocheck
const _ = require('lodash');

const AndroidEmulatorCookie = require('../../../../cookies/AndroidEmulatorCookie');
const AllocationDriverBase = require('../../AllocationDriverBase');

const { patchAvdSkinConfig } = require('./patchAvdSkinConfig');

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
    this._launchInfo = {};
  }

  /**
   * @param deviceConfig
   * @returns {Promise<AndroidEmulatorCookie>}
   */
  async allocate(deviceConfig) {
    const avdName = deviceConfig.device.avdName;

    await this._avdValidator.validate(avdName, deviceConfig.headless);
    await this._fixAvdConfigIniSkinNameIfNeeded(avdName, deviceConfig.headless);

    const allocResult = await this._allocationHelper.allocateDevice(avdName);
    const { adbName } = allocResult;

    this._launchInfo[adbName] = {
      avdName,
      isRunning: allocResult.isRunning,
      launchOptions: {
        bootArgs: deviceConfig.bootArgs,
        gpuMode: deviceConfig.gpuMode,
        headless: deviceConfig.headless,
        readonly: deviceConfig.readonly,
        port: allocResult.placeholderPort,
      },
    };

    return new AndroidEmulatorCookie(adbName);
  }

  /**
   * @param {AndroidEmulatorCookie} deviceCookie
   * @returns {Promise<void>}
   */
  async postAllocate(deviceCookie) {
    const { adbName } = deviceCookie;
    const { avdName, isRunning, launchOptions } = this._launchInfo[adbName];

    await this._emulatorLauncher.launch(avdName, adbName, isRunning, launchOptions);
    await this._adb.apiLevel(adbName);
    await this._adb.disableAndroidAnimations(adbName);
    await this._adb.unlockScreen(adbName);
  }

  /**
   * @param cookie { AndroidEmulatorCookie }
   * @param options { DeallocOptions }
   * @return { Promise<void> }
   */
  async free(cookie, options = {}) {
    const { adbName } = cookie;

    await this._allocationHelper.deallocateDevice(adbName);

    if (options.shutdown) {
      await this._emulatorLauncher.shutdown(adbName);
    }
  }

  async _fixAvdConfigIniSkinNameIfNeeded(avdName, isHeadless) {
    const rawBinaryVersion = await this._emulatorVersionResolver.resolve(isHeadless);
    const binaryVersion = _.get(rawBinaryVersion, 'major');
    return await patchAvdSkinConfig(avdName, binaryVersion);
  }
}

module.exports = EmulatorAllocDriver;
