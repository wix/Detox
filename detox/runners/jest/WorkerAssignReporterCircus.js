const { TestEventListenerBase } = require('./CircusTestEventListeners');
const WorkerAssignReporter = require('./WorkerAssignReporterImpl');

class WorkerAssignReporterCircus extends TestEventListenerBase {
  constructor(detox) {
    super();
    this._reporter = new WorkerAssignReporter(detox);
  }

  _onSuiteStart(event) {
    const { describeBlock } = event;
    if (describeBlock.parent && describeBlock.parent.parent === undefined) {
      this._reporter.report(describeBlock.name);
    }
  }
}

module.exports = WorkerAssignReporterCircus;
