const chalk = require('chalk').default;
const ReporterBase = require('./ReporterBase');

class WorkerAssignReporterImpl extends ReporterBase {
  constructor(detox) {
    super();
    this.device = detox.device;
  }

  report(workerName) {
    this._traceln(`${chalk.whiteBright(workerName)} assigned to ${chalk.blueBright(this.device.name)}`);
    this._traceln('');
  }
}

module.exports = WorkerAssignReporterImpl;
