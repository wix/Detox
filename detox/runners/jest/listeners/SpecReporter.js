const chalk = require('chalk').default;
const { traceln } = require('../utils/stdout');
const log = require('../../../src/utils/logger');

const RESULT_SKIPPED = chalk.yellow('SKIPPED');
const RESULT_FAILED = chalk.red('FAIL');
const RESULT_PENDING = chalk.yellow('PENDING');
const RESULT_SUCCESS = chalk.green('OK');
const RESULT_OTHER = 'UNKNOWN';

class SpecReporter {
  constructor() {
    this._suites = [];
    this._suitesDesc = '';
  }

  suite_start({ describeBlock }) {
    if (describeBlock.parent === undefined) {
      return;
    }

    this._suites.push({ description: describeBlock.name });
    this._regenerateSuitesDesc();
  }

  suite_end({ describeBlock }) {
    if (describeBlock.parent === undefined) {
      return;
    }

    this._suites.pop();
    this._regenerateSuitesDesc();
    if (!this._suites.length) {
      traceln();
    }
  }

  test_start({ test }) {
    this._traceTest({ description: test.name });
  }

  test_done({ test }) {
    this._traceTest({
      description: test.name,
      status: test.errors.length ? RESULT_FAILED : RESULT_SUCCESS,
    });
  }

  test_skip({ test }) {
    this._traceTest({
      description: test.name,
      status: RESULT_SKIPPED,
    });
  }

  _regenerateSuitesDesc() {
    this._suitesDesc = '';

    const total = this._suites.length;
    this._suites.forEach((suite, index) => {
      this._suitesDesc = this._suitesDesc
        .concat((index > 0) ? ' > ' : '')
        .concat(suite.description)
        .concat((index === total - 1) ? ': ' : '');
    });
    this._suitesDesc = chalk.bold.white(this._suitesDesc);
  }

  _traceTest({description, status}) {
    const desc = this._suitesDesc + chalk.gray(description) + chalk.gray(status ? ` [${status}]` : '');
    log.info({event: 'SPEC_STATE_CHANGE'}, desc);
  }
}

module.exports = SpecReporter;
