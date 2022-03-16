const chalk = require('chalk').default;
const _ = require('lodash');

const log = require('../../src/utils/logger').child();

class WorkerAssignReporterImpl {
  constructor(detox) {
    this.device = detox && detox.device;
  }

  report(workerName) {
    const deviceName = _.attempt(() => this.device.name);
    const formattedDeviceName = _.isError(deviceName)
      ? chalk.redBright('undefined')
      : chalk.blueBright(deviceName);

    log.info({ event: 'WORKER_ASSIGN' }, `${chalk.whiteBright(workerName)} is assigned to ${formattedDeviceName}`);
  }
}

module.exports = WorkerAssignReporterImpl;
