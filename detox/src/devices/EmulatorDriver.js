const _ = require('lodash');
const path = require('path');
const tempfile = require('tempfile');
const Emulator = require('./android/Emulator');
const EmulatorTelnet = require('./android/EmulatorTelnet');
const Environment = require('../utils/environment');
const AndroidDriver = require('./AndroidDriver');
const ini = require('ini');
const fs = require('fs');
const os = require('os');

const SCREENSHOT_PATH = '/sdcard/screenshot.png';
const VIDEO_PATH = '/sdcard/recording.mp4';

class EmulatorDriver extends AndroidDriver {
  constructor(client) {
    super(client);
    this.emulator = new Emulator();
    this._recordings = {};
  }

  async _fixEmulatorConfigIniSkinName(name) {
    const configFile = `${os.homedir()}/.android/avd/${name}.avd/config.ini`;
    const config = ini.parse(fs.readFileSync(configFile, 'utf-8'));

    if (!config['skin.name']) {
      const width = config['hw.lcd.width'];
      const height = config['hw.lcd.height'];

      if (width === undefined || height === undefined) {
        throw new Error(`Emulator with name ${name} has a corrupt config.ini file (${configFile}), try fixing it by recreating an emulator.`);
      }

      config['skin.name'] = `${width}x${height}`;
      fs.writeFileSync(configFile, ini.stringify(config));
    }
    return config;
  }

  async boot(deviceId) {
    await this.emulator.boot(deviceId);
    await this.adb.waitForBootComplete(deviceId);
  }

  async acquireFreeDevice(name) {
    const avds = await this.emulator.listAvds();
    if (!avds) {
      const avdmanagerPath = path.join(Environment.getAndroidSDKPath(), 'tools', 'bin', 'avdmanager');
      throw new Error(`Could not find any configured Android Emulator. 
      Try creating a device first, example: ${avdmanagerPath} create avd --force --name Nexus_5X_API_24 --abi x86 --package 'system-images;android-24;google_apis_playstore;x86' --device "Nexus 5X"
      or go to https://developer.android.com/studio/run/managing-avds.html for details on how to create an Emulator.`);
    }
    if (_.indexOf(avds, name) === -1) {
      throw new Error(`Can not boot Android Emulator with the name: '${name}', 
      make sure you choose one of the available emulators: ${avds.toString()}`);
    }

    await this._fixEmulatorConfigIniSkinName(name);
    await this.emulator.boot(name);

    const adbDevices = await this.adb.devices();
    const filteredDevices = _.filter(adbDevices, {type: 'emulator', name: name});

    let adbName;
    switch (filteredDevices.length) {
      case 0:
        throw new Error(`Could not find '${name}' on the currently ADB attached devices, 
      try restarting adb 'adb kill-server && adb start-server'`);
      case 1:
        const adbDevice = filteredDevices[0];
        adbName = adbDevice.adbName;
        break;
      default:
        throw new Error(`Got more than one device corresponding to the name: ${name}`);
    }

    await this.adb.waitForBootComplete(adbName);
    await this.adb.unlockScreen(adbName);
    return adbName;
  }

  async shutdown(deviceId) {
    const port = _.split(deviceId, '-')[1];
    const telnet = new EmulatorTelnet();
    await telnet.connect(port);
    await telnet.kill();
  }

  async takeScreenshot(deviceId) {
    const dst = tempfile('.png');
    await this.adb.adbCmd(deviceId, `shell screencap ${SCREENSHOT_PATH}`);
    await this.adb.adbCmd(deviceId, `pull ${SCREENSHOT_PATH} ${dst}`);
    return dst;
  }

  async startVideo(deviceId) {
    const adb = this.adb;
    await adb.adbCmd(deviceId, `shell rm -f ${VIDEO_PATH}`);

    let {width, height} = await adb.getScreenSize();
    let promise = spawnRecording();
    promise.catch(handleRecordingTermination);

    // XXX: ugly loop to make sure we continue only if recording has begun.
    let recording = false;
    let size = 0;
    while (!recording) {
      size = 0;
      recording = true;
      try {
        size = await adb.getFileSize(deviceId, VIDEO_PATH);
        if (size < 1) {
          recording = false;
        }
      } catch (e) {
        recording = false;
      }
    }

    this._recordings[deviceId] = promise.childProcess;

    function handleRecordingTermination(result) {
      const proc = result.childProcess;
      // XXX: error code -38 (= 218) means that encoder was not able to create
      // video of current size, let's try smaller resolution.
      if (proc.exitCode === 218) {
        width >>= 1;
        height >>= 1;
        promise = spawnRecording();
        promise.catch(handleRecordingTermination);
      }
    }

    function spawnRecording() {
      return adb.screenrecord(deviceId, VIDEO_PATH, width, height);
    }
  }

  async stopVideo(deviceId) {
    if (this._recordings[deviceId]) {
      const adb = this.adb;
      this._recordings[deviceId].kill(2);
      delete this._recordings[deviceId];

      // XXX: need to wait a little before pulling file from emulator, otherwise
      // file might be corrupt.
      //
      // TODO: each test should have it's own video file, which would be queued
      // to be copied after all the tests have run. This should help to prevent
      // file corruption and avoid 1 second delay per test.
      await adb.adbCmd(deviceId, 'shell sleep 1');

      const dest = tempfile('.mp4');
      await adb.adbCmd(deviceId, `pull ${VIDEO_PATH} ${dest}`);
      await adb.adbCmd(deviceId, `shell rm ${VIDEO_PATH}`);
      return dest;
    }
  }
}

module.exports = EmulatorDriver;
