const path = require('path');

const chalk = require('chalk').default;
const _ = require('lodash');

const log = require('../../../src/utils/logger').child();

class WorkerAssignReporter {
  constructor({ detox, env }) {
    this._detox = detox;
    this._env = env;
  }

  run_start() {
    log.info({ event: 'WORKER_ASSIGN' }, `${this._formatTestName()} is assigned to ${this._formatDeviceName()}`);
  }

  _formatDeviceName() {
    const deviceName = _.attempt(() => this._detox.device.name);
    const formattedDeviceName = _.isError(deviceName)
      ? chalk.redBright('undefined')
      : chalk.blueBright(deviceName);

    return formattedDeviceName;
  }

  _formatTestName() {
    const testName = path.basename(this._env.testPath);
    return chalk.whiteBright(testName);
  }
}

module.exports = WorkerAssignReporter;
