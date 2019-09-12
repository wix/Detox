const chalk = require('chalk').default;
const ReporterBase = require('./ReporterBase');

const RESULT_SKIPPED = chalk.yellow('SKIPPED');
const RESULT_FAILED = chalk.red('FAIL');
const RESULT_PENDING = chalk.yellow('PENDING');
const RESULT_SUCCESS = chalk.green('OK');
const RESULT_OTHER = 'UNKNOWN';

class SpecReporter extends ReporterBase {
  constructor() {
    super();
    this._suites = [];
    this._suitesDesc = '';
  }

  onSuiteStart({description}) {
    this._suites.push({description});
    this._regenerateSuitesDesc();
  }

  onSuiteEnd() {
    this._suites.pop();
    this._regenerateSuitesDesc();

    if (!this._suites.length) {
      this._traceln('');
    }
  }

  onTestStart({description}) {
    this._traceTest({description});
  }

  onTestEnd({description}, result) {
    let status = '';
    switch (result) {
      case 'skipped': status = RESULT_SKIPPED; break;
      case 'failed': status = RESULT_FAILED; break;
      case 'pending': status = RESULT_PENDING; break;
      case 'success': status = RESULT_SUCCESS; break;
      default: status = RESULT_OTHER; break;
    }
    this._traceTest({description}, status);
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

  _traceTest({description}, status) {
    this._traceln(this._suitesDesc + chalk.gray(description) + chalk.gray(status ? ` [${status}]` : ''));
  }
}

module.exports = SpecReporter;
