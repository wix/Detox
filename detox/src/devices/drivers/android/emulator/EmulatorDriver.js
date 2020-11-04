const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const ini = require('ini');
const AndroidDriver = require('../AndroidDriver');
const EmulatorDeviceAllocator = require('./EmulatorDeviceAllocator');
const AVDValidator = require('./AVDValidator');
const AVDsResolver = require('./AVDsResolver');
const EmulatorLauncher = require('./EmulatorLauncher');
const EmulatorVersionResolver = require('./EmulatorVersionResolver');
const { EmulatorExec } = require('../exec/EmulatorExec');
const EmulatorTelnet = require('../tools/EmulatorTelnet');
const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const environment = require('../../../../utils/environment');
const retry = require('../../../../utils/retry');
const log = require('../../../../utils/logger').child({ __filename });
const argparse = require('../../../../utils/argparse');

const EMU_BIN_STABLE_SKIN_VER = 28;

class EmulatorDriver extends AndroidDriver {
  constructor(config) {
    super(config);

    const emulatorExec = new EmulatorExec();
    this._emuVersionResolver = new EmulatorVersionResolver(emulatorExec);
    this._emuLauncher = new EmulatorLauncher(emulatorExec);

    const avdsResolver = new AVDsResolver(emulatorExec);
    this._avdValidator = new AVDValidator(avdsResolver, this._emuVersionResolver);
    this._deviceAllocator = new EmulatorDeviceAllocator(this.deviceRegistry, this.adb);

    this._name = 'Unspecified Emulator';
  }

  get name() {
    return this._name;
  }

  async acquireFreeDevice(deviceQuery) {
    const avdName = _.isPlainObject(deviceQuery) ? deviceQuery.avdName : deviceQuery;

    await this._avdValidator.validate(avdName);
    await this._fixEmulatorConfigIniSkinNameIfNeeded(avdName);

    const {
      adbName,
      placeholderPort,
    } = await this._deviceAllocator.allocateDevice(avdName);

    await this._boot(avdName, adbName, placeholderPort);

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

  async _boot(avdName, adbName, bootPort) {
    const coldBoot = !!bootPort;
    if (coldBoot) {
      await this._emuLauncher.launch(avdName, { port: bootPort });
    }

    await this._waitForBootToComplete(adbName);
    await this.emitter.emit('bootDevice', { coldBoot, deviceId: adbName, type: avdName });
  }

  async _waitForBootToComplete(deviceId) {
    await retry({ retries: 240, interval: 2500 }, async () => {
      const isBootComplete = await this.adb.isBootComplete(deviceId);

      if (!isBootComplete) {
        throw new DetoxRuntimeError({
          message: `Android device ${deviceId} has not completed its boot yet.`,
        });
      }
    });
  }

  async shutdown(deviceId) {
    await this.emitter.emit('beforeShutdownDevice', { deviceId });
    const port = _.split(deviceId, '-')[1];
    const telnet = new EmulatorTelnet();
    await telnet.connect(port);
    await telnet.kill();
    await this.emitter.emit('shutdownDevice', { deviceId });
  }

  async _fixEmulatorConfigIniSkinNameIfNeeded(avdName) {
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
        throw new Error(`Emulator with name ${avdName} has a corrupt config.ini file (${configFile}), try fixing it by recreating an emulator.`);
      }

      config['skin.name'] = `${width}x${height}`;
      fs.writeFileSync(configFile, ini.stringify(config));
    }
  }
}

module.exports = EmulatorDriver;
