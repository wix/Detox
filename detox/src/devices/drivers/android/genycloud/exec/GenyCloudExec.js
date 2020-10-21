const _ = require('lodash');
const exec = require('../../../../../utils/exec').execWithRetriesAndLogs;

class GenyCloudExec {
  getRecipe(name) {
    return this._exec(`recipes list --name "${name}"`);
  }

  getInstances() {
    return this._exec(`instances list`);
  }

  startInstance(recipeUUID, instanceName) {
    // TODO should we use --no-wait so as to release workers lock "mutex" asap and then wait-for-boot as we do with google emulators?
    return this._exec(`instances start --stop-when-inactive ${recipeUUID} "${instanceName}"`);
  }

  adbConnect(instanceUUID) {
    return this._exec(`instances adbconnect ${instanceUUID}`);
  }

  stopInstance(instanceUUID) {
    return this._exec(`instances stop ${instanceUUID}`);
  }

  async _exec(args) {
    try {
      const rawResult = await this.__exec(args);
      return JSON.parse(rawResult);
    } catch (error) {
      throw JSON.parse(error.stderr);
    }
  }

  async __exec(args) {
    const options = {
      statusLogs: {
        retrying: true,
      },
    };
    return (await exec(`"gmsaas" --format compactjson ${args}`, options )).stdout;
  }
}

module.exports = GenyCloudExec;
