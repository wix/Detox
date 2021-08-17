const FileXfer = require('./FileXfer');

const EMU_TEMP_PATH = '/data/local/tmp';
const EMU_TEMP_INSTALL_PATH = `${EMU_TEMP_PATH}/detox`;

class TempFileXfer extends FileXfer {
  constructor(adb) {
    super(adb, EMU_TEMP_INSTALL_PATH);
  }
}

module.exports = TempFileXfer;
