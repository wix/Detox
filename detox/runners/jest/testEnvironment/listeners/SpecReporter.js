const chalk = require('chalk');
const noop = require('lodash/noop');

const { config, log, session } = require('../../../../internals');
const { traceln } = require('../utils/stdout');

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

  setup() {
    const jestSection = config.testRunner.jest;
    const reportSpecs = jestSection && jestSection.reportSpecs;
    const enabled = reportSpecs !== undefined ? reportSpecs : session.workersCount === 1;

    if (!enabled) {
      this.run_describe_start = noop;
      this.run_describe_finish = noop;
      this.test_start = noop;
      this.test_done = noop;
      this.test_skip = noop;
    }
  }

  run_describe_start(event) {
    if (event.describeBlock.parent !== undefined) {
      this._onSuiteStart({
        description: event.describeBlock.name,
      });
    }
  }

  run_describe_finish(event) {
    if (event.describeBlock.parent !== undefined) {
      this._onSuiteEnd();
    }
  }

  test_start(event) {
    const { test } = event;
    this._onTestStart({
      description: test.name,
      invocations: test.invocations,
    });
  }

  test_done(event) {
    const { test } = event;
    const testInfo = {
      description: test.name,
      invocations: test.invocations,
    };
    this._onTestEnd(testInfo, test.errors.length ? 'failed' : 'success');
  }

  test_skip(event) {
    const testInfo = {
      description: event.test.name,
    };
    this._onTestEnd(testInfo, 'skipped');
  }

  _onSuiteStart({ description }) {
    this._suites.push({ description });
    this._regenerateSuitesDesc();
  }

  _onSuiteEnd() {
    this._suites.pop();
    this._regenerateSuitesDesc();

    if (!this._suites.length) {
      traceln('');
    }
  }

  _onTestStart({ description, invocations = 1 }) {
    this._traceTest({ description, invocations });
  }

  _onTestEnd({ description, invocations = 1 }, result) {
    let status;
    switch (result) {
      case 'skipped': status = RESULT_SKIPPED; break;
      case 'failed': status = RESULT_FAILED; break;
      case 'pending': status = RESULT_PENDING; break;
      case 'success': status = RESULT_SUCCESS; break;
      default: status = RESULT_OTHER; break;
    }
    this._traceTest({ description, invocations }, status);
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
    this._suitesDesc = chalk.bold(this._suitesDesc);
  }

  _traceTest({ description, invocations }, _status = undefined) {
    const testDescription = chalk.gray(description);
    const retriesDescription = (invocations > 1) ? chalk.gray(` [Retry #${invocations - 1}]`) : '';
    const status = chalk.gray(_status ? ` [${_status}]` : '');
    const desc = this._suitesDesc + testDescription + retriesDescription + status;
    log.info({ cat: 'lifecycle' }, desc);
  }
}

module.exports = SpecReporter;
