const _ = require('lodash');
const path = require('path');
const AVDsResolver = require('./AVDsResolver');
const environment = require('../../../../utils/environment');

class AVDValidator {
  constructor(emulatorExec) {
    this._avdsResolver = new AVDsResolver(emulatorExec);
  }

  async validate(avdName) {
    const avds = await this._avdsResolver.resolve(avdName);
    if (!avds) {
      const avdmanagerPath = path.join(environment.getAndroidSDKPath(), 'tools', 'bin', 'avdmanager');

      throw new Error(`Could not find any configured Android Emulator.\n
        Try creating a device first, example: ${avdmanagerPath} create avd --force --name Pixel_API_28 --abi x86_64 --package "system-images;android-28;default;x86_64" --device "pixel"
        or go to https://developer.android.com/studio/run/managing-avds.html for details on how to create an Emulator.`);
    }

    if (_.indexOf(avds, avdName) === -1) {
      throw new Error(`Can not boot Android Emulator with the name: '${avdName}',
        make sure you choose one of the available emulators: ${avds.toString()}`);
    }
  }
}

 module.exports = AVDValidator;
