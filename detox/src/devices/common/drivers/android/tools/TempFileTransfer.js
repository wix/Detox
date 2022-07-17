const FileTransfer = require('./FileTransfer');

const FILE_PATH = '/data/local/tmp/detox';

class TempFileTransfer extends FileTransfer {
  constructor(adb) {
    super(adb, FILE_PATH);
  }
}

module.exports = {
  TempFileTransfer,
  FILE_PATH
};
