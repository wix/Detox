// @ts-nocheck
const semver = require('semver');

const { DetoxRuntimeError } = require('../../../errors');
const environment = require('../../../utils/environment');
const EnvironmentValidatorBase = require('../EnvironmentValidatorBase');

const MIN_GMSAAS_VERSION = '1.6.0';

class GenycloudEnvValidator extends EnvironmentValidatorBase {
  /**
   * @param authService { GenyAuthService }
   * @param exec { GenyCloudExec }
   */
  constructor({ authService, exec }) {
    super();
    this._authService = authService;
    this._exec = exec;
  }

  async validate() {
    await this._validateGmsaasVersion();
    await this._validateGmsaasAuth();
  }

  async _validateGmsaasVersion() {
    const { version } = await this._exec.getVersion();
    if (semver.lt(version, MIN_GMSAAS_VERSION)) {
      throw new DetoxRuntimeError({
        message: `Your Genymotion-Cloud executable (found in ${environment.getGmsaasPath()}) is too old! (version ${version})`,
        hint: `Detox requires version 1.6.0, or newer. To use 'android.genycloud' type devices, you must upgrade it, first.`,
      });
    }
  }

  async _validateGmsaasAuth() {
    if (!await this._authService.getLoginEmail()) {
      throw new DetoxRuntimeError({
        message: `Cannot run tests using 'android.genycloud' type devices, because Genymotion was not logged-in to!`,
        hint: `Log-in to Genymotion-cloud by running this command (and following instructions):\n${environment.getGmsaasPath()} auth login --help`,
      });
    }
  }
}

module.exports = GenycloudEnvValidator;
