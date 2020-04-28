const EMU_TEMP_PATH = '/data/local/tmp';
const EMU_TEMP_INSTALL_PATH = `${EMU_TEMP_PATH}/detox`;

class AppInstallHelper {
  constructor(adb, deviceId, tempDir = EMU_TEMP_INSTALL_PATH) {
    this._adb = adb;
    this._deviceId = deviceId;
    this._tempDir = tempDir;
  }

  async install(appBinaryPath, testBinaryPath) {
    await this._prepareTempDirOnDevice();

    const appBinaryPathOnTarget = this._getTargetBinaryPath(false);
    await this._pushAndInstallBinary(appBinaryPath, appBinaryPathOnTarget);

    const testBinaryPathOnTarget = this._getTargetBinaryPath(true);
    await this._pushAndInstallBinary(testBinaryPath, testBinaryPathOnTarget);
  }

  async _prepareTempDirOnDevice() {
    await this._adb.shell(this._deviceId, `rm -fr ${this._tempDir}`);
    await this._adb.shell(this._deviceId, `mkdir -p ${this._tempDir}`);
  }

  async _pushAndInstallBinary(binaryPath, binaryPathOnTarget) {
    await this._adb.push(this._deviceId, binaryPath, binaryPathOnTarget);
    await this._adb.remoteInstall(this._deviceId, binaryPathOnTarget);
  }

  _getTargetBinaryPath(isTestBinary) {
    const filename = isTestBinary ? 'Test.apk' : 'Application.apk';
    return `${this._tempDir}/${filename}`;
  }
}

module.exports = AppInstallHelper;
