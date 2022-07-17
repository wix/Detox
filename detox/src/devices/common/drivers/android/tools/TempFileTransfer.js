const FileTransfer = require('./FileTransfer');

const EMU_TEMP_INSTALL_PATH = '/data/local/tmp/detox';

class TempFileTransfer extends FileTransfer {
  constructor(adb) {
    super(adb, EMU_TEMP_INSTALL_PATH);
  }
}

module.exports = {
  TempFileTransfer,
  EMU_TEMP_INSTALL_PATH
};
