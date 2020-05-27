const EMU_TEMP_PATH = '/data/local/tmp';
const EMU_TEMP_INSTALL_PATH = `${EMU_TEMP_PATH}/detox`;

class AppInstallHelper {
  constructor(adb, tempDir = EMU_TEMP_INSTALL_PATH) {
    this._adb = adb;
    this._tempDir = tempDir;
  }

  async install(deviceId, appBinaryPath, testBinaryPath) {
    await this._prepareTempDirOnDevice(deviceId);

    const appBinaryPathOnTarget = this._getTargetBinaryPath(false);
    await this._pushAndInstallBinary(deviceId, appBinaryPath, appBinaryPathOnTarget);

    const testBinaryPathOnTarget = this._getTargetBinaryPath(true);
    await this._pushAndInstallBinary(deviceId, testBinaryPath, testBinaryPathOnTarget);
  }

  async _prepareTempDirOnDevice(deviceId) {
    await this._adb.shell(deviceId, `rm -fr ${this._tempDir}`);
    await this._adb.shell(deviceId, `mkdir -p ${this._tempDir}`);
  }

  async _pushAndInstallBinary(deviceId, binaryPath, binaryPathOnTarget) {
    await this._adb.push(deviceId, binaryPath, binaryPathOnTarget);
    await this._adb.remoteInstall(deviceId, binaryPathOnTarget);
  }

  _getTargetBinaryPath(isTestBinary) {
    const filename = isTestBinary ? 'Test.apk' : 'Application.apk';
    return `${this._tempDir}/${filename}`;
  }
}

module.exports = AppInstallHelper;
