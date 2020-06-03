const path = require('path');
const WorkerAssignReporter = require('./WorkerAssignReporterImpl');

class WorkerAssignReporterJasmine {
  constructor({ detox }) {
    this._reporter = new WorkerAssignReporter(detox);
  }

  suiteStarted(suiteInfo) {
    const workerName = path.basename(suiteInfo.testPath);
    this._reporter.report(workerName);
  }
}
module.exports = WorkerAssignReporterJasmine;
