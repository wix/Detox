const WorkerAssignReporter = require('./WorkerAssignReporterImpl');

class WorkerAssignReporterCircus {
  constructor({ detox }) {
    this._reporter = new WorkerAssignReporter(detox);
  }

  run_describe_start(event) {
    const { describeBlock } = event;

    if (describeBlock.parent && describeBlock.parent.parent === undefined) {
      this._reporter.report(describeBlock.name);
    }
  }
}

module.exports = WorkerAssignReporterCircus;
