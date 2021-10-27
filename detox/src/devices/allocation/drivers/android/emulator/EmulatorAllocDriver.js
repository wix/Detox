const _ = require('lodash');

const { traceCall } = require('../../../../../utils/trace');
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
  }

  /**
   * @param deviceConfig
   * @returns {Promise<AndroidEmulatorCookie>}
   */
  async allocate(deviceConfig) {
    const avdName = deviceConfig.device.avdName;

    await this._avdValidator.validate(avdName);
    await this._fixAvdConfigIniSkinNameIfNeeded(avdName, deviceConfig.headless);

    const allocResult = await this._allocationHelper.allocateDevice(avdName);
    const { adbName, placeholderPort, isRunning } = allocResult;
    const launchOptions = {
      bootArgs: deviceConfig.bootArgs,
      gpuMode: deviceConfig.gpuMode,
      headless: deviceConfig.headless,
      readonly: deviceConfig.readonly,
      port: placeholderPort,
    };

    await this._launchEmulator(avdName, adbName, isRunning, launchOptions);
    await this._prepareEmulator(adbName);

    return new AndroidEmulatorCookie(adbName);
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

  async _launchEmulator(avdName, adbName, isRunning, options) {
    try {
      await traceCall('emulatorLaunch', () =>
        this._emulatorLauncher.launch(avdName, adbName, isRunning, options));
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

module.exports = EmulatorAllocDriver;
