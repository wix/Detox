const { VerboseReporter: JestVerboseReporter } = require('@jest/reporters'); // eslint-disable-line node/no-extraneous-require

const DetoxRuntimeError = require('../../src/errors/DetoxRuntimeError');

class DetoxStreamlineJestReporter extends JestVerboseReporter {

  constructor(globalConfig) {
    super(globalConfig);
    this._assertConfig();
  }

  /**
   * Monkey patch for _wrapStdio method of Jest's DefaultReporter class
   * https://github.com/facebook/jest/blob/84466b7bb187d33ffd336bd9fc76111bba511fe6/packages/jest-reporters/src/default_reporter.ts#L47
   *
   * The official implementation does the following:
   * - For the <b>stderr</b> stream, it overrides the 'write' method with a simple bulked output mechanism,
   *   which aggregates output onto a buffer but flushes it immediately.
   * - For the <b>stdout</b> stream, it overrides the 'write' method with a time-based bulked output mechanism,
   *   which aggregates output onto a buffer and flushes only in 100ms intervals.
   *
   * This gives priority, to a certain extent, to stderr output, over stdout.
   * See: https://github.com/facebook/jest/blob/84466b7bb187d33ffd336bd9fc76111bba511fe6/packages/jest-reporters/src/default_reporter.ts#L73
   *
   * Typically, user logs are sent to stdout, and Jest reporter's (e.g. test-suite summary) - to stderr.
   *
   * ---
   * Our goal is to have these 3 types of output streamlined in real time:
   *
   * 1. Jest suite-level lifecycle logging, typically done by the super-class' impl.
   *    Note: Jest does not notify spec-level events to reporters.
   * 2. Jasmine real-time, spec-level lifecycle logging.
   * 3. User in-test logging (e.g. for debugging).
   *
   * It's easy to see that this cannot be done while stderr and stdout are not of equal priority.
   * Therefore, this hack enforces immediate-flushing approach to <b>both</b> stderr and stdout.
   */
  _wrapStdio(stream) {
    const originalWrite = stream.write;
    let buffer = [];

    const flushBufferedOutput = () => {
      const string = buffer.join('');
      buffer = []; // This is to avoid conflicts between random output and status text

      this._clearStatus();

      if (string) {
        originalWrite.call(stream, string);
      }

      this._printStatus();

      this._bufferedOutput.delete(flushBufferedOutput);
    };

    this._bufferedOutput.add(flushBufferedOutput);

    stream.write = chunk => {
      buffer.push(chunk);
      flushBufferedOutput();
      return true;
    };
  }

  _assertConfig() {
    if (!this._isVerboseEnabled()) {
      // Non-verbose mode makes Jest swizzle 'console' with a buffered output impl, which prevents
      // user and detox' jasmine-lifecycle logs from showing in real time.
      throw new DetoxRuntimeError({
        message: 'Cannot run properly unless Jest is in verbose mode',
        hint: 'See https://jestjs.io/docs/en/configuration#verbose-boolean for more details',
      });
    }

    if (this._hasDefaultReporter()) {
      // This class overrides Jest's VerboseReporter, which is set by default. Can't have both.
      throw new DetoxRuntimeError({
        message: 'Cannot work alongside the default Jest reporter. Please remove it from the reporters list.',
        hint: 'See https://jestjs.io/docs/en/configuration#reporters-array-modulename-modulename-options for more details',
      });
    }
  }

  _isVerboseEnabled() {
    return !!this._globalConfig.verbose;
  }

  _hasDefaultReporter() {
    return !!this._globalConfig.reporters.find(reporterDef => {
      const [reporterName] = reporterDef;
      return reporterName === 'default';
    });
  }
}

module.exports = DetoxStreamlineJestReporter;
