const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const ini = require('ini');
const AndroidDriver = require('../AndroidDriver');
const EmulatorDeviceAllocation = require('./helpers/EmulatorDeviceAllocation');
const AVDValidator = require('./AVDValidator');
const AVDsResolver = require('./AVDsResolver');
const EmulatorLauncher = require('./helpers/EmulatorLauncher');
const EmulatorVersionResolver = require('./EmulatorVersionResolver');
const FreeEmulatorFinder = require('./FreeEmulatorFinder');
const { EmulatorExec } = require('../exec/EmulatorExec');
const DeviceRegistry = require('../../../DeviceRegistry');
const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const environment = require('../../../../utils/environment');
const log = require('../../../../utils/logger').child({ __filename });
const argparse = require('../../../../utils/argparse');

const EMU_BIN_STABLE_SKIN_VER = 28;

class EmulatorDriver extends AndroidDriver {
  constructor(config) {
    super(config);
    this._deviceRegistry = DeviceRegistry.forAndroid();

    const emulatorExec = new EmulatorExec();
    this._emulatorLauncher = new EmulatorLauncher(emulatorExec, this.emitter);
    this._emuVersionResolver = new EmulatorVersionResolver(emulatorExec);

    const avdsResolver = new AVDsResolver(emulatorExec);
    this._avdValidator = new AVDValidator(avdsResolver, this._emuVersionResolver);

    const freeEmulatorFinder = new FreeEmulatorFinder(this.adb, this._deviceRegistry)
    this._deviceAllocation = new EmulatorDeviceAllocation(this._deviceRegistry, freeEmulatorFinder, this._emulatorLauncher, this.adb, this.emitter);
  }

  /**
   * @param deviceQuery
   * @returns {Promise<EmulatorDeviceId>}
   */
  async acquireFreeDevice(deviceQuery) {
    const avdName = _.isPlainObject(deviceQuery) ? deviceQuery.avdName : deviceQuery;

    await this._avdValidator.validate(avdName);
    await this._fixAvdConfigIniSkinNameIfNeeded(avdName);

    const deviceId = await this._deviceAllocation.allocateDevice(avdName);
    const { adbName } = deviceId;
    await this.adb.apiLevel(adbName);
    await this.adb.disableAndroidAnimations(adbName);
    await this.adb.unlockScreen(adbName);
    return deviceId;
  }

  /**
   * @param deviceId {EmulatorDeviceId}
   * @param _binaryPath {String}
   * @param _testBinaryPath {String}
   * @returns {Promise<void>}
   */
  async installApp(deviceId, _binaryPath, _testBinaryPath) {
    if (argparse.getArgValue('force-adb-install') === 'true') {
      return await super.installApp(deviceId, _binaryPath, _testBinaryPath);
    }

    const { adbName } = deviceId;
    const {
      binaryPath,
      testBinaryPath,
    } = this._getInstallPaths(_binaryPath, _testBinaryPath);
    await this.appInstallHelper.install(adbName, binaryPath, testBinaryPath);
  }

  /*async*/ binaryVersion() {
    return this._emuVersionResolver.resolve();
  }

  /**
   * @param deviceId {EmulatorDeviceId}
   * @param bundleId {String}
   * @returns {Promise<void>}
   */
  async cleanup(deviceId, bundleId) {
    try {
      await super.cleanup(deviceId, bundleId);
    } finally {
      await this._deviceAllocation.deallocateDevice(deviceId)
    }
  }

  /**
   * @param deviceId {EmulatorDeviceId}
   * @returns {Promise<void>}
   */
  async shutdown(deviceId) {
    await this._emulatorLauncher.shutdown(deviceId);
  }

  async _fixAvdConfigIniSkinNameIfNeeded(avdName) {
    const binaryVersion = _.get(await this.binaryVersion(), 'major');
    if (!binaryVersion) {
      log.warn({ event: 'EMU_SKIN_CFG_PATCH' }, [
        'Failed to detect emulator version! (see previous logs)',
        'This leaves Detox unable to tell if it should automatically apply this patch-fix: https://stackoverflow.com/a/47265664/453052, which seems to be needed in emulator versions < 28.',
        'If you feel this is not needed, you can either ignore this message, or otherwise apply the patch manually.',
      ].join('\n'));
      return;
    }

    if (binaryVersion >= EMU_BIN_STABLE_SKIN_VER) {
      return;
    }

    const avdPath = environment.getAvdDir(avdName);
    const configFile = path.join(avdPath, 'config.ini');
    const config = ini.parse(fs.readFileSync(configFile, 'utf-8'));

    if (!config['skin.name']) {
      const width = config['hw.lcd.width'];
      const height = config['hw.lcd.height'];

      if (width === undefined || height === undefined) {
        throw new DetoxRuntimeError(`Emulator with name ${avdName} has a corrupt config.ini file (${configFile}), try fixing it by recreating an emulator.`);
      }

      config['skin.name'] = `${width}x${height}`;
      fs.writeFileSync(configFile, ini.stringify(config));
    }
  }
}

module.exports = EmulatorDriver;
