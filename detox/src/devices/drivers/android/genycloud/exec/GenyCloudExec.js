const exec = require('../../../../../utils/exec').execWithRetriesAndLogs;

class GenyCloudExec {
  constructor(binaryPath) {
    this.binaryExec = `"${binaryPath}" --format compactjson`;
  }

  whoAmI() {
    return this._exec(`auth whoami`);
  }

  getRecipe(name) {
    return this._exec(`recipes list --name "${name}"`);
  }

  getInstances() {
    return this._exec(`instances list -q`);
  }

  startInstance(recipeUUID, instanceName) {
    return this._exec(`instances start --stop-when-inactive --no-wait ${recipeUUID} "${instanceName}"`);
  }

  adbConnect(instanceUUID) {
    return this._exec(`instances adbconnect ${instanceUUID}`);
  }

  stopInstance(instanceUUID) {
    const options = {
      retries: 3,
    };
    return this._exec(`instances stop ${instanceUUID}`, options);
  }

  async _exec(args, options) {
    try {
      const rawResult = await this.__exec(args, options);
      return JSON.parse(rawResult);
    } catch (error) {
      throw new Error(error.stderr);
    }
  }

  async __exec(args, _options) {
    const options = {
      ..._options,
      statusLogs: {
        retrying: true,
      },
    };
    return (await exec(`${this.binaryExec} ${args}`, options )).stdout;
  }
}

module.exports = GenyCloudExec;
