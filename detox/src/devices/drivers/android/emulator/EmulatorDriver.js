const fs = require('fs');
const path = require('path');

const ini = require('ini');
const _ = require('lodash');

const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const argparse = require('../../../../utils/argparse');
const environment = require('../../../../utils/environment');
const log = require('../../../../utils/logger').child({ __filename });
const DeviceRegistry = require('../../../DeviceRegistry');
const AndroidDriver = require('../AndroidDriver');
const { EmulatorExec } = require('../exec/EmulatorExec');

const AVDValidator = require('./AVDValidator');
const AVDsResolver = require('./AVDsResolver');
const EmulatorVersionResolver = require('./EmulatorVersionResolver');
const FreeEmulatorFinder = require('./FreeEmulatorFinder');
const EmulatorDeviceAllocation = require('./helpers/EmulatorDeviceAllocation');
const EmulatorLauncher = require('./helpers/EmulatorLauncher');

const EMU_BIN_STABLE_SKIN_VER = 28;

class EmulatorDriver extends AndroidDriver {
  constructor(config) {
    super(config);
    this._name = 'Unspecified Emulator';
    this._deviceRegistry = DeviceRegistry.forAndroid();

    const emulatorExec = new EmulatorExec();
    this._emulatorLauncher = new EmulatorLauncher({
      adb: this.adb,
      emulatorExec,
      eventEmitter: this.emitter,
    });
    this._emuVersionResolver = new EmulatorVersionResolver(emulatorExec);

    const avdsResolver = new AVDsResolver(emulatorExec);
    this._avdValidator = new AVDValidator(avdsResolver, this._emuVersionResolver);

    const freeEmulatorFinder = new FreeEmulatorFinder(this.adb, this._deviceRegistry);
    this._deviceAllocation = new EmulatorDeviceAllocation(this._deviceRegistry, freeEmulatorFinder, this._emulatorLauncher, this.adb, this.emitter);
  }

  get name() {
    return this._name;
  }

  async acquireFreeDevice(deviceQuery) {
    const avdName = _.isPlainObject(deviceQuery) ? deviceQuery.avdName : deviceQuery;

    await this._avdValidator.validate(avdName);
    await this._fixAvdConfigIniSkinNameIfNeeded(avdName);

    const adbName = await this._deviceAllocation.allocateDevice(avdName);
    await this.adb.apiLevel(adbName);
    await this.adb.disableAndroidAnimations(adbName);
    await this.adb.unlockScreen(adbName);

    this._name = `${adbName} (${avdName})`;
    return adbName;
  }

  async installApp(deviceId, _binaryPath, _testBinaryPath) {
    if (argparse.getArgValue('force-adb-install') === 'true') {
      return await super.installApp(deviceId, _binaryPath, _testBinaryPath);
    }

    const {
      binaryPath,
      testBinaryPath,
    } = this._getInstallPaths(_binaryPath, _testBinaryPath);

    await this.appInstallHelper.install(deviceId, binaryPath, testBinaryPath);
  }

  /*async*/ binaryVersion() {
    return this._emuVersionResolver.resolve();
  }

  async cleanup(deviceId, bundleId) {
    try {
      await super.cleanup(deviceId, bundleId);
    } finally {
      await this._deviceAllocation.deallocateDevice(deviceId);
    }
  }

  async shutdown(deviceId) {
    await this.instrumentation.setTerminationFn(null);
    await this._emulatorLauncher.shutdown(deviceId);
  }

  async setLocation(deviceId, lat, lon) {
    await this.adb.setLocation(deviceId, lat, lon);
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
