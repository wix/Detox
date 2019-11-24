const chalk = require('chalk').default;
const ReporterBase = require('./ReporterBase');
const log = require('../../src/utils/logger').child();

class WorkerAssignReporterImpl extends ReporterBase {
  constructor(detox) {
    super();
    this.device = detox.device;
  }

  report(workerName) {
    log.info({event: 'WORKER_ASSIGN'}, `${chalk.whiteBright(workerName)} assigned to ${chalk.blueBright(this.device.name)}`);
  }
}

module.exports = WorkerAssignReporterImpl;
