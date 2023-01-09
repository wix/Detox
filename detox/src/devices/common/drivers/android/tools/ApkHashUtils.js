const fs = require('fs');
const path = require('path');

const generateHash = require('../../../../../utils/generateHash');

const { FILE_PATH } = require('./TempFileTransfer');

class ApkHashUtils {
  constructor(props) {
    this.adb = props.adb;
  }

  async saveHashToDevice({ fileTransfer, bundleId, deviceId, binaryPath }) {
    const hashFilename = this._getHashFilename(bundleId);
    console.log(`yondbg saveHashToDevice hashFilename: ${hashFilename}`);
    await this._createLocalHashFile(hashFilename, binaryPath);
    await fileTransfer.prepareDestinationDir(deviceId);
    await fileTransfer.send(deviceId, hashFilename, hashFilename);
    this._deleteLocalHashFile(hashFilename);
  }

  async isHashUpToDate({ deviceId, bundleId, binaryPath }) {
    const localHash = await generateHash(binaryPath);
    console.log(`yondbg isHashUpToDate localHash: ${localHash}`);
    console.log(`yondbg isHashUpToDate cwd is ${process.cwd()}`);
    const destinationPath = path.posix.join(FILE_PATH, this._getHashFilename(bundleId));
    console.log(`yondbg isHashUpToDate destinationPath: ${destinationPath}`);
    const remoteHash = await this.adb.readFile(deviceId, destinationPath, true);
    console.log(`yondbg isHashUpToDate remoteHash: ${remoteHash}`);
    console.log(`yondbg isHashUpToDate localHash === remoteHash: ${localHash === remoteHash}`);
    return localHash === remoteHash;
  }

  _getHashFilename(bundleId) {
    return `${bundleId}.hash`;
  }

  async _createLocalHashFile(hashFilename, binaryPath) {
    const hash = await generateHash(binaryPath);
    console.log(`yondbg _createLocalHashFile hash: ${hash}`);

    try {
      fs.writeFileSync(hashFilename, hash, 'utf8');
    } catch (e) {
      console.log(`yondbg _createLocalHashFile error: ${e}`);
    }
  }

  _deleteLocalHashFile(hashFilename) {
    const localFilePath = process.cwd() + '/' + hashFilename;
    const fileExists = fs.existsSync(localFilePath);
    console.log(`yondbg _deleteLocalHashFile localFilePath: ${localFilePath}`);
    console.log(`yondbg _deleteLocalHashFile fileExists: ${fileExists}`);

    if (fileExists) {
      fs.unlinkSync(hashFilename);
    }
  }
}

module.exports = ApkHashUtils;
