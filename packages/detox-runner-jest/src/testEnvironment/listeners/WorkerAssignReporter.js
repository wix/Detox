const path = require('path');

const chalk = require('chalk');
const _ = require('lodash');

const { device } = require('../../../..');
const { config, log } = require('../../../../internals');

class WorkerAssignReporter {
  constructor({ env }) {
    this._testName = path.basename(env.testPath);
  }

  run_start() {
    if (config.testRunner.jest.reportWorkerAssign) {
      log.info({ cat: 'lifecycle' }, `${chalk.bold(this._testName)} is assigned to ${this._formatDeviceName()}`);
    }
  }

  _formatDeviceName() {
    const deviceName = _.attempt(() => device.name);
    const formattedDeviceName = _.isError(deviceName)
      ? chalk.redBright('undefined')
      : chalk.blueBright(deviceName);

    return formattedDeviceName;
  }
}

module.exports = WorkerAssignReporter;
