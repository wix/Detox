const _ = require('lodash');
const fsext = require('fs-extra');

class AndroidToolsLocator {
  constructor(env) {
    this.env = env;

    this._aaptPath = null;
  }

  getSDKPath() {
    const sdkPath = this.env.ANDROID_SDK_ROOT || this.env.ANDROID_HOME;

    if (!sdkPath) {
      throw new Error(`$ANDROID_SDK_ROOT is not defined, set the path to the SDK installation directory into $ANDROID_SDK_ROOT,
    Go to https://developer.android.com/studio/command-line/variables.html for more details`);
    }

    return sdkPath;
  }

  async getAAPTPath() {
    if (this._aaptPath) {
      return this._aaptPath;
    }

    this._aaptPath = this._doGetAAPTPath();
  }

  async _doGetAAPTPath() {
    const sdkPath = this.getSDKPath();
    const buildToolsDir = path.join(sdkPath, 'build-tools');
    const buildToolsSubdirs = await fsext.getDirectories(buildToolsDir);
    const latestBuildToolsVersion = _.last(buildToolsSubdirs);

    return path.join(buildToolsDir, latestBuildToolsVersion, 'aapt');
  }

  getEmulatorPath() {
    return path.join(this.getSDKPath(), 'tools', 'emulator');
  }
}

module.exports = AndroidToolsLocator;
