const fs = require('fs');

const saveHashToRemote = async ({ tempFileTransfer, deviceId, bundleId, hash }) => {
  const hashFilename = `${bundleId}.hash`;

  _createLocalHashFile(hashFilename, hash);
  await tempFileTransfer.prepareDestinationDir(deviceId);
  await tempFileTransfer.send(deviceId, hashFilename, hashFilename);
  _deleteLocalHashFile(hashFilename);
};

const _createLocalHashFile = (hashFilename, hash) => {
  fs.writeFileSync(hashFilename, hash);
};

const _deleteLocalHashFile = (hashFilename) => {
  fs.unlinkSync(hashFilename);
};

module.exports = { saveHashToRemote };
