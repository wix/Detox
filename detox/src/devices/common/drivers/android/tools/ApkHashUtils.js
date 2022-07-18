const fs = require('fs');
const path = require('path');

const generateHash = require('../../../../../utils/generateHash');

const { FILE_PATH } = require('./TempFileTransfer');

const saveHashToDevice = async ({ tempFileTransfer, bundleId, deviceId, binaryPath }) => {
  const hashFilename = _getHashFilename(bundleId);
  await _createLocalHashFile(hashFilename, binaryPath);
  await tempFileTransfer.prepareDestinationDir(deviceId);
  await tempFileTransfer.send(deviceId, hashFilename, hashFilename);
  _deleteLocalHashFile(hashFilename);
};

const isHashUpdated = async ({ adb, deviceId, bundleId, binaryPath }) => {
  const localHash = await generateHash(binaryPath);
  const destinationPath = path.posix.join(FILE_PATH, _getHashFilename(bundleId));
  const remoteHash = await adb.readFile(deviceId, destinationPath, true);
  return localHash === remoteHash;
};

const _getHashFilename = (bundleId) => {
  return `${bundleId}.hash`;
};

const _createLocalHashFile = async (hashFilename, binaryPath) => {
  const hash = await generateHash(binaryPath);
  fs.writeFileSync(hashFilename, hash);
};

const _deleteLocalHashFile = (hashFilename) => {
  fs.unlinkSync(hashFilename);
};

module.exports = { isHashUpdated, saveHashToDevice };
