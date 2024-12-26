// @ts-nocheck
const exec = require('../../../../../../utils/childProcess').execWithRetriesAndLogs;

const defaultFlags = '--format compactjson';

class GenyCloudExec {
  constructor(binaryPath) {
    this.binaryExec = binaryPath;
    process.env.GMSAAS_USER_AGENT_EXTRA_DATA = process.env.GMSAAS_USER_AGENT_EXTRA_DATA || 'detox';
  }

  getVersion() {
    return this._exec('--version');
  }

  doctor() {
    return this._exec('doctor', { retries: 0 }, '--format text');
  }

  getRecipe(name) {
    return this._exec(`recipes list --name "${name}"`);
  }

  getInstance(instanceUUID) {
    return this._exec(`instances get ${instanceUUID}`);
  }

  getInstances() {
    return this._exec('instances list -q');
  }

  startInstance(recipeUUID, instanceName) {
    return this._exec(`instances start --no-wait ${recipeUUID} "${instanceName}"`, { retries: 0 });
  }

  adbConnect(instanceUUID) {
    return this._exec(`instances adbconnect ${instanceUUID}`, { retries: 0 });
  }

  stopInstance(instanceUUID) {
    const options = {
      retries: 3,
    };
    return this._exec(`instances stop ${instanceUUID}`, options);
  }

  async _exec(args, options, flags = defaultFlags) {
    try {
      const rawResult = await this.__exec(flags, args, options);
      return JSON.parse(rawResult);
    } catch (error) {
      throw new Error(error.stderr);
    }
  }

  async __exec(flags, args, _options) {
    const options = {
      ..._options,
      statusLogs: {
        retrying: true,
      },
    };
    return (await exec(`"${this.binaryExec}" ${flags} ${args}`, options )).stdout;
  }
}

module.exports = GenyCloudExec;
