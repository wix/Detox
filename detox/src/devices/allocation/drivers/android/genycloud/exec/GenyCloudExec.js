// @ts-nocheck
const exec = require('../../../../../../utils/childProcess').execWithRetriesAndLogs;

class GenyCloudExec {
  constructor(binaryPath) {
    this.binaryExec = binaryPath;
    process.env.GMSAAS_USER_AGENT_EXTRA_DATA = process.env.GMSAAS_USER_AGENT_EXTRA_DATA || 'detox';
  }

  getVersion() {
    return this._exec('--version');
  }

  doctor() {
    return this._exec('doctor', { retries: 0 }, 'text');
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

  async _exec(args, options, format = 'compactjson') {
    try {
      const rawResult = await this.__exec(args, options, format);
      return (
        format === 'compactjson' ? JSON.parse(rawResult) : rawResult
      );
    } catch (error) {
      throw new Error(error.stderr);
    }
  }

  async __exec(args, options, format) {
    const _options = {
      ...options,
      statusLogs: {
        retrying: true,
      },
    };
    return (await exec(`"${this.binaryExec}" --format ${format} ${args}`, _options )).stdout;
  }
}

module.exports = GenyCloudExec;
