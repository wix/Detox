const _ = require('lodash');
const path = require('path');
const chalk = require('chalk').default;
const log = require('../../../src/utils/logger').child();

class WorkerAssignReporter {
  constructor({ detox, env }) {
    this._detox = detox;
    this._env = env;
  }

  run_start(event, state) {
    log.info({event: 'WORKER_ASSIGN'}, `${this._formatTestName()} is assigned to ${this._formatDeviceName()}`);
  }

  _formatDeviceName() {
    const deviceName = _.attempt(() => this._detox.device.name);
    const formattedDeviceName = _.isError(deviceName)
      ? chalk.redBright('undefined')
      : chalk.blueBright(deviceName);

    return formattedDeviceName;
  }

  _formatTestName() {
    // TODO: check if there is a less intrusive way?
    const JEST_MATCHERS_OBJECT = Symbol.for('$$jest-matchers-object');
    const { testPath } = this._env.global[JEST_MATCHERS_OBJECT].state;
    const testName = path.basename(testPath);

    return chalk.whiteBright(testName);
  }
}

module.exports = WorkerAssignReporter;
