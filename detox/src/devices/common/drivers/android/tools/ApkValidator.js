const DetoxRuntimeError = require('../../../../../errors/DetoxRuntimeError');

const setupGuideHint = 'For further assistance, visit the project setup guide (select the Android tabs): https://wix.github.io/Detox/docs/introduction/project-setup';

class ApkValidator {
  constructor(aapt) {
    this._aapt = aapt;
  }

  async validateAppApk(binaryPath) {
    let isAppApk;

    try {
      isAppApk = !await this._aapt.isTestAPK(binaryPath);
    } catch (e) {
      throw this._composeAaptBasedError(e, binaryPath, 'binary');
    }

    if (!isAppApk) {
      throw new DetoxRuntimeError({
        message: `App APK at path ${binaryPath} was detected as the *test* APK!`,
        hint: `Your binary path was probably wrongly set in the active Detox configuration.\n${setupGuideHint}`,
      });
    }
  }

  async validateTestApk(binaryPath) {
    let isTestApk;
    try {
      isTestApk = await this._aapt.isTestAPK(binaryPath);
    } catch (e) {
      throw this._composeAaptBasedError(e, binaryPath, 'test-binary');
    }

    if (!isTestApk) {
      throw new DetoxRuntimeError({
        message: `Test APK at path ${binaryPath} was detected as the *app* APK!`,
        hint: `Your test test-binary path was probably wrongly set in the active Detox configuration.\n${setupGuideHint}`,
      });
    }
  }

  _composeAaptBasedError(aaptError, binaryPath, configKeyType) {
    return new DetoxRuntimeError({
      message: `Failed to get details about the APK at path ${binaryPath}. Root cause:\n${aaptError}`,
      hint: `Check that the ${configKeyType} path in the active Detox configuration has been set to a path of an APK file.\n${setupGuideHint}`,
    });
  }

}

module.exports = ApkValidator;
