const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const os = require('os');
const ini = require('ini');
const AndroidDriver = require('./AndroidDriver');
const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const DeviceRegistry = require('../DeviceRegistry');
const Emulator = require('../android/Emulator');
const EmulatorTelnet = require('../android/EmulatorTelnet');
const environment = require('../../utils/environment');
const retry = require('../../utils/retry');
const log = require('../../utils/logger').child({ __filename });

const DetoxEmulatorsPortRange = {
  min: 10000,
  max: 20000
};

const ACQUIRE_DEVICE_EV = 'ACQUIRE_DEVICE';

class EmulatorDriver extends AndroidDriver {
  constructor(config) {
    super(config);

    this.emulator = new Emulator();
    this.deviceRegistry = new DeviceRegistry({
      lockfilePath: environment.getDeviceLockFilePathAndroid(),
    });
    this.pendingBoots = {};
    this._name = 'Unspecified Emulator';
  }

  get name() {
    return this._name
  }

  async acquireFreeDevice(deviceQuery) {
    const avdName = _.isPlainObject(deviceQuery) ? deviceQuery.avdName : deviceQuery;

    await this._validateAvd(avdName);
    await this._fixEmulatorConfigIniSkinNameIfNeeded(avdName);

    log.debug({ event: ACQUIRE_DEVICE_EV }, `Looking up a device based on ${avdName}`);

    const adbName = await this.deviceRegistry.allocateDevice(async () => {
      let freeEmulatorAdbName;

      const { devices } = await this.adb.devices();
      for (const candidate of devices) {
        const isEmulator = candidate.type === 'emulator';
        const isBusy = this.deviceRegistry.isDeviceBusy(candidate.adbName);

        if (isEmulator && !isBusy) {
          if (await candidate.queryName() === avdName) {
            freeEmulatorAdbName = candidate.adbName;
            log.debug({ event: ACQUIRE_DEVICE_EV }, `Found ${candidate.adbName}!`);
            break;
          }
          log.debug({ event: ACQUIRE_DEVICE_EV }, `${candidate.adbName} is available but AVD is different`);
        } else {
          log.debug({ event: ACQUIRE_DEVICE_EV }, `${candidate.adbName} is not a free emulator`, isEmulator, !isBusy);
        }
      }

      return freeEmulatorAdbName || this._createDevice();
    });

    log.debug({ event: ACQUIRE_DEVICE_EV }, `Settled on ${adbName}`);

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

  async _boot(avdName, adbName) {
    const coldBoot = !!this.pendingBoots[adbName];

    if (coldBoot) {
      const port = this.pendingBoots[adbName];
      await this.emulator.boot(avdName, {port});
      delete this.pendingBoots[adbName];
    }

    await this._waitForBootToComplete(adbName);
    await this.emitter.emit('bootDevice', { coldBoot, deviceId: adbName });
  }

  async _validateAvd(avdName) {
    const avds = await this.emulator.listAvds();
    if (!avds) {
      const avdmanagerPath = path.join(environment.getAndroidSDKPath(), 'tools', 'bin', 'avdmanager');

      throw new Error(`Could not find any configured Android Emulator. 
      Try creating a device first, example: ${avdmanagerPath} create avd --force --name Pixel_2_API_26 --abi x86 --package 'system-images;android-26;google_apis_playstore;x86' --device "pixel"
      or go to https://developer.android.com/studio/run/managing-avds.html for details on how to create an Emulator.`);
    }

    if (_.indexOf(avds, avdName) === -1) {
      throw new Error(`Can not boot Android Emulator with the name: '${avdName}',
      make sure you choose one of the available emulators: ${avds.toString()}`);
    }
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
    return config;
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
