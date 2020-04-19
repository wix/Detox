const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const ini = require('ini');
const AndroidDriver = require('./AndroidDriver');
const FreeEmulatorFinder = require('./emulator/FreeEmulatorFinder');
const AVDValidator = require('./emulator/AVDValidator');
const EmulatorLauncher = require('./emulator/EmulatorLauncher');
const EmulatorVersionResolver = require('./emulator/EmulatorVersionResolver');
const { EmulatorExec } = require('./tools/EmulatorExec');
const EmulatorTelnet = require('./tools/EmulatorTelnet');
const AppInstallHelper = require('./tools/AppInstallHelper');
const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');
const DeviceRegistry = require('../../DeviceRegistry');
const environment = require('../../../utils/environment');
const retry = require('../../../utils/retry');
const log = require('../../../utils/logger').child({ __filename });
const argparse = require('../../../utils/argparse');
const sleep = require('../../../utils/sleep');

const DetoxEmulatorsPortRange = {
  min: 10000,
  max: 20000
};

const ACQUIRE_DEVICE_EV = 'ACQUIRE_DEVICE';
const LAUNCH_DEVICE_EV = 'LAUNCH_DEVICE';
const EMU_BIN_STABLE_SKIN_VER = 28;
const DEVICE_PRE_LAUNCH_SUSPEND_TIME_MS = 1500;
const DEVICE_POST_LAUNCH_SUSPEND_TIME_MS = 8000;

class EmulatorDriver extends AndroidDriver {
  constructor(config) {
    super(config);

    this.deviceRegistry = new DeviceRegistry({
      lockfilePath: environment.getDeviceLockFilePathAndroid(),
    });

    const emulatorExec = new EmulatorExec();
    this._emuVersionResolver = new EmulatorVersionResolver(emulatorExec);
    this._emuLauncher = new EmulatorLauncher(emulatorExec);
    this._avdValidator = new AVDValidator(emulatorExec);

    this.pendingBoots = {};
    this._name = 'Unspecified Emulator';
  }

  get name() {
    return this._name
  }

  async acquireFreeDevice(deviceQuery) {
    const avdName = _.isPlainObject(deviceQuery) ? deviceQuery.avdName : deviceQuery;

    await this._avdValidator.validate(avdName);
    await this._fixEmulatorConfigIniSkinNameIfNeeded(avdName);

    const deviceInfo = await this._allocateDevice(avdName);
    const adbName = deviceInfo.deviceId;

    await this._boot(avdName, deviceInfo);

    await this.adb.apiLevel(adbName);
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

    await this.uninstallAppByApk(deviceId, binaryPath);

    const installHelper = new AppInstallHelper(this.adb);
    await installHelper.install(deviceId, binaryPath, testBinaryPath);
  }

  async cleanup(adbName, bundleId) {
    await this.deviceRegistry.disposeDevice(adbName);
    await super.cleanup(adbName, bundleId);
  }

  /*async*/ binaryVersion() {
    return this._emuVersionResolver.resolve();
  }

  async _boot(avdName, deviceInfo) {
    const adbName = deviceInfo.deviceId;
    const coldBoot = !!this.pendingBoots[adbName];

    if (coldBoot) {
      await this._suspendPreLaunchIfNeeded(deviceInfo);
      const port = this.pendingBoots[adbName];
      await this._emuLauncher.launch(avdName, { port });
      delete this.pendingBoots[adbName];
      await this._suspendPostLaunchIfNeeded(deviceInfo);
    }

    await this._waitForBootToComplete(adbName);
    await this.emitter.emit('bootDevice', { coldBoot, deviceId: adbName, type: adbName });
  }

  async _suspendPreLaunchIfNeeded(deviceInfo) {
    const { deviceIndex } = deviceInfo;
    if (deviceIndex) {
      const delay = DEVICE_PRE_LAUNCH_SUSPEND_TIME_MS * deviceIndex;
      log.debug({ event: LAUNCH_DEVICE_EV }, `Suspending pre-launch of ${deviceInfo.deviceId} for ${delay}ms...`);
      await sleep(delay);
    }
  }

  async _suspendPostLaunchIfNeeded(deviceInfo) {
    const delay = DEVICE_POST_LAUNCH_SUSPEND_TIME_MS;
    log.debug({ event: LAUNCH_DEVICE_EV }, `Suspending post-launch of ${deviceInfo.deviceId} for ${delay}ms...`);
    await sleep(delay);
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

  async _allocateDevice(avdName) {
    log.debug({ event: ACQUIRE_DEVICE_EV }, `Looking up a device based on ${avdName}`);
    const deviceInfo = await this.deviceRegistry.allocateDevice(() => this._doAllocateDevice(avdName));
    log.debug({ event: ACQUIRE_DEVICE_EV }, `Settled on ${deviceInfo.deviceId}`);
    return deviceInfo;
  }

  async _doAllocateDevice(avdName) {
    const freeEmulatorFinder = new FreeEmulatorFinder(this.adb, this.deviceRegistry, avdName);
    const freeEmulatorAdbName = await freeEmulatorFinder.findFreeDevice();
    return freeEmulatorAdbName || this._createDevice();
  }

  async _createDevice() {
    const {min, max} = DetoxEmulatorsPortRange;
    let port = Math.random() * (max - min) + min;
    port = port & 0xFFFFFFFE; // Should always be even

    const adbName = `emulator-${port}`;
    this.pendingBoots[adbName] = port;
    return adbName;
  }
}

module.exports = EmulatorDriver;
