const _ = require('lodash');
const chalk = require('chalk').default;
const ReporterBase = require('./ReporterBase');
const log = require('../../src/utils/logger').child();

class WorkerAssignReporterImpl extends ReporterBase {
  constructor(detox) {
    super();
    this.device = detox.device;
  }

  report(workerName) {
    const deviceName = _.attempt(() => this.device.name);
    const formattedDeviceName = _.isError(deviceName)
      ? chalk.redBright('undefined')
      : chalk.blueBright(deviceName);

    log.info({event: 'WORKER_ASSIGN'}, `${chalk.whiteBright(workerName)} is assigned to ${formattedDeviceName}`);
  }
}

module.exports = WorkerAssignReporterImpl;
