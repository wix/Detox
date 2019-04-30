const chalk = require('chalk').default;

class DetoxTraceAdapter /* implements JasmineReporter */ {

  constructor() {
    this._suites = [];
    this._suitesDesc = '';
  }

  suiteStarted(suiteInfo) {
    this._suites.push(suiteInfo);
    this._regenerateSuitesDesc();
  }

  suiteDone() {
    this._suites.pop();
    this._regenerateSuitesDesc();

    if (!this._suites.length) {
      this._traceln('');
    }
  }

  specStarted(result) {
    this._traceSpec(result);
  }

  specDone(result) {
    if (result.status === 'disabled') {
      this._traceSpec(result, chalk.yellow('SKIPPED'));
    } else if (result.status === 'failed') {
      this._traceSpec(result, chalk.red('FAIL'));
    } else if (result.pendingReason) {
      this._traceSpec(result, chalk.yellow('PENDING'));
    } else {
      this._traceSpec(result, chalk.green('OK'));
    }
  }

  _regenerateSuitesDesc() {
    this._suitesDesc = '';

    const total = this._suites.length;
    this._suites.forEach((suite, index) => {
      this._suitesDesc = this._suitesDesc
        .concat((index > 0) ? ' > ' : '')
        .concat(chalk.bold.white(suite.description))
        .concat((index === total - 1) ? ': ' : '');
    });
  }

  _traceSpec({description}, status) {
    this._traceln(this._suitesDesc + chalk.gray(description) + chalk.gray(status ? ` [${status}]` : ''));
  }

  _trace(message) {
    process.stdout.write(message);
  }

  _traceln(message) {
    this._trace(message);
    process.stdout.write('\n');
  }
}

module.exports = DetoxTraceAdapter;
