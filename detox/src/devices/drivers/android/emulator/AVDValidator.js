const _ = require('lodash');
const path = require('path');
const environment = require('../../../../utils/environment');
const logger = require('../../../../utils/logger').child({ __filename });

const REQUIRED_EMULATOR_MAJOR = 29;

class AVDValidator {
  constructor(avdsResolver, emulatorVersionResolver) {
    this._avdsResolver = avdsResolver;
    this._emulatorVersionResolver = emulatorVersionResolver;
  }

  async validate(avdName) {
    const avds = await this._avdsResolver.resolve(avdName);
    this._assertAVDs(avds);
    await this._assertAVDMatch(avds, avdName);
    await this._validateEmulatorVer();
  }

  _assertAVDs(avds) {
    if (!avds) {
      const avdmanagerPath = path.join(environment.getAndroidSDKPath(), 'tools', 'bin', 'avdmanager');

      throw new Error(`Could not find any configured Android Emulator.\n
        Try creating a device first, example: ${avdmanagerPath} create avd --force --name Pixel_API_28 --abi x86_64 --package "system-images;android-28;default;x86_64" --device "pixel"
        or go to https://developer.android.com/studio/run/managing-avds.html for details on how to create an Emulator.`);
    }
  }

  _assertAVDMatch(avds, avdName) {
    if (_.indexOf(avds, avdName) === -1) {
      throw new Error(`Can not boot Android Emulator with the name: '${avdName}',
        make sure you choose one of the available emulators: ${avds.toString()}`);
    }
  }

  async _validateEmulatorVer() {
    const emulatorVersion = await this._emulatorVersionResolver.resolve();
    if (!emulatorVersion) {
      logger.warn({ event: 'AVD_VALIDATION' }, 'Emulator version detection failed (See previous logs)');
      return;
    }

    if (emulatorVersion.major < REQUIRED_EMULATOR_MAJOR) {
      logger.warn({ event: 'AVD_VALIDATION' }, [
          `Your installed emulator binary version (${emulatorVersion.toString()}) is too old, and may not be suitable for parallel test execution.`,
          'We strongly recommend you upgrade to the latest version using the SDK manager: $ANDROID_HOME/tools/bin/sdkmanager --list'
        ].join('\n'));
    }
  }
}

module.exports = AVDValidator;
