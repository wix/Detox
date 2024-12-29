// @ts-nocheck
const semver = require('semver');

const { DetoxRuntimeError } = require('../../../errors');
const environment = require('../../../utils/environment');
const EnvironmentValidatorBase = require('../EnvironmentValidatorBase');

const MIN_GMSAAS_VERSION = '1.6.0';
const MIN_GMSAAS_VERSION_WITH_DOCTOR = '1.11.0';

class GenycloudEnvValidator extends EnvironmentValidatorBase {
  /**
   * @param authService { GenyAuthService }
   * @param exec { GenyCloudExec }
   */
  constructor({ exec }) {
    super();
    this._exec = exec;
  }

  async validate() {
    const { version } = await this._exec.getVersion();

    await this._validateGmsaasVersion(version);
    await this._validateGmsaasDoctorCheck(version);
  }

  async _validateGmsaasVersion(version) {
    if (semver.lt(version, MIN_GMSAAS_VERSION)) {
      throw new DetoxRuntimeError({
        message: `Your Genymotion-Cloud executable (found in ${environment.getGmsaasPath()}) is too old! (version ${version})`,
        hint: `Detox requires version 1.6.0, or newer. To use 'android.genycloud' type devices, you must upgrade it, first.`,
      });
    }
  }

  async _validateGmsaasDoctorCheck(version) {
    if (semver.lt(version, MIN_GMSAAS_VERSION_WITH_DOCTOR)) {
      return;
    }

    try {
      await this._exec.doctor();
    } catch (e) {
      throw new DetoxRuntimeError({
        message: e.message,
      });
    }
  }
}

module.exports = GenycloudEnvValidator;
