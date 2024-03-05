const { EmulatorExec } = require('../../common/drivers/android/emulator/exec/EmulatorExec');

class EmulatorServiceLocator {
  constructor() {
    this.exec = new EmulatorExec();
  }
}

module.exports = new EmulatorServiceLocator();
