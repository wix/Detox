const _ = require('lodash');

const AVDValidator = require('./AVDValidator');
const AVDsResolver = require('./AVDsResolver');
const EmulatorDeviceAllocation = require('./EmulatorDeviceAllocation');
const EmulatorVersionResolver = require('./EmulatorVersionResolver');
const FreeEmulatorFinder = require('./FreeEmulatorFinder');
const { patchAvdSkinConfig } = require('./patchAvdSkinConfig');
const AllocationDriverBase = require('../AllocationDriverBase');
const EmulatorLauncher = require('./EmulatorLauncher');
const { traceCall } = require('../../../../utils/trace');
const AndroidEmulatorCookie = require('../../AndroidEmulatorCookie');

class EmulatorAllocDriver extends AllocationDriverBase {
  /**
   * @param emulatorExec { EmulatorExec }
   * @param adb { ADB }
   * @param eventEmitter { AsyncEmitter }
   * @param deviceRegistry { DeviceRegistry }
   */
  constructor({ emulatorExec, adb, eventEmitter, deviceRegistry }) {
    super();

    this._adb = adb;
    this._eventEmitter = eventEmitter;

    // TODO ASDASD DI this (i.e. via factory)
    const avdsResolver = new AVDsResolver(emulatorExec);
    this._emuVersionResolver = new EmulatorVersionResolver(emulatorExec);
    this._avdValidator = new AVDValidator(avdsResolver, this._emuVersionResolver);

    const freeEmulatorFinder = new FreeEmulatorFinder(adb, deviceRegistry);
    this._emulatorLauncher = new EmulatorLauncher({ adb, emulatorExec, eventEmitter });
    this._deviceAllocation = new EmulatorDeviceAllocation(deviceRegistry, freeEmulatorFinder, adb, eventEmitter);
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
    const rawBinaryVersion = await this._emuVersionResolver.resolve();
    const binaryVersion = _.get(rawBinaryVersion, 'major');
    return await patchAvdSkinConfig(avdName, binaryVersion);
  }

  async _launchEmulator(avdName, adbName, port) {
    try {
      await traceCall('emulatorLaunch', () =>
        this._emulatorLauncher.launch(avdName, { port }));
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
