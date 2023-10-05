const { pid } = require('process');

class PIDService {
  getPid() {
    return pid;
  }

  /**
   * Checks if the other process id is running in the current operating system
   * @param {number} otherPID
   * @returns {boolean}
   */
  isAlive(otherPID) {
    try {
      process.kill(otherPID, 0);
      return true;
    } catch (ex) {
      if (ex.code === 'ESRCH') {
        return false;
      }
      throw ex;
    }
  }

}

module.exports = PIDService;
