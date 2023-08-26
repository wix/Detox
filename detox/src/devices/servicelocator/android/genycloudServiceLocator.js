class GenycloudServiceLocator {
  constructor() {
    this._exec = null;
  }

  // Note: important to keep lazy because of implicit validations that are sensitive (inside environment, in particular).
  get exec() {
    if (!this._exec) {
      const Exec = require('../../allocation/drivers/android/genycloud/exec/GenyCloudExec');
      const environment = require('../../../utils/environment');
      this._exec = new Exec(environment.getGmsaasPath());
    }
    return this._exec;
  }
}

module.exports = new GenycloudServiceLocator();
