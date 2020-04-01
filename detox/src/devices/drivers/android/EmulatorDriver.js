const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const ini = require('ini');
const AndroidDriver = require('./AndroidDriver');
const FreeEmulatorFinder = require('./emulator/FreeEmulatorFinder');
const AVDValidator = require('./emulator/AVDValidator');
const { EmulatorExec } = require('./tools/EmulatorExec');
const Emulator = require('./tools/Emulator');
const EmulatorTelnet = require('./tools/EmulatorTelnet');
const EmulatorVersionResolver = require('./emulator/EmulatorVersionResolver');
const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');
const DeviceRegistry = require('../../DeviceRegistry');
const environment = require('../../../utils/environment');
const retry = require('../../../utils/retry');
const log = require('../../../utils/logger').child({ __filename });

const DetoxEmulatorsPortRange = {
  min: 10000,
  max: 20000
};

const ACQUIRE_DEVICE_EV = 'ACQUIRE_DEVICE';
const EMU_BIN_STABLE_SKIN_VER = 28;

class EmulatorDriver extends AndroidDriver {
  constructor(config) {
    super(config);

    this._emulatorExec = new EmulatorExec();
    this.emulator = new Emulator(this._emulatorExec);
    this.deviceRegistry = new DeviceRegistry({
      lockfilePath: environment.getDeviceLockFilePathAndroid(),
    });
    this._emuVersionResolver = new EmulatorVersionResolver(this._emulatorExec);
    this._avdValidator = new AVDValidator(this._emulatorExec);
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

    const adbName = await this._allocateDevice(avdName);

    await this._boot(avdName, adbName);

    await this.adb.apiLevel(adbName);
    await this.adb.unlockScreen(adbName);

    this._name = `${adbName} (${avdName})`;
    return adbName;
  }

  async cleanup(adbName, bundleId) {
    await this.deviceRegistry.disposeDevice(adbName);
    await super.cleanup(adbName, bundleId);
  }

  /*async*/ binaryVersion() {
    return this._emuVersionResolver.resolve();
  }

  async _boot(avdName, adbName) {
    const coldBoot = !!this.pendingBoots[adbName];

    if (coldBoot) {
      const port = this.pendingBoots[adbName];
      await this.emulator.boot(avdName, {port});
      delete this.pendingBoots[adbName];
    }

    await this._waitForBootToComplete(adbName);
    await this.emitter.emit('bootDevice', { coldBoot, deviceId: adbName, type: adbName });
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
    const binaryVersion = _.get(await this.binaryVersion(), 'major', EMU_BIN_STABLE_SKIN_VER - 1);
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
    const adbName = await this.deviceRegistry.allocateDevice(() => this._doAllocateDevice(avdName));
    log.debug({ event: ACQUIRE_DEVICE_EV }, `Settled on ${adbName}`);
    return adbName;
  }

  async _doAllocateDevice(avdName) {
    const FreeEmulatorFinder = new FreeEmulatorFinder(this.adb, this.deviceRegistry, avdName);
    const freeEmulatorAdbName = await FreeEmulatorFinder.findFreeDevice();
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
