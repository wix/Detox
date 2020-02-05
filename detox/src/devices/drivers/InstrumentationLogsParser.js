const INSTRUMENTATION_LOGS_PREFIX = 'INSTRUMENTATION_STATUS';
const STACKTRACE_PREFIX_TEXT = INSTRUMENTATION_LOGS_PREFIX + ': stack=';

class InstrumentationLogsParser {
  hasStackTraceLog(logsDump) {
    return logsDump.includes(STACKTRACE_PREFIX_TEXT);
  }

  getStackTrace(logsDump) {
    const logLines = logsDump.split('\n');

    const index = this._findStackTraceLog(logLines);
    const stackTrace = this._extractStackTrace(logLines, index);
    return stackTrace;
  }

  _findStackTraceLog(logLines) {
    let i;
    for (i = 0; i < logLines.length && !logLines[i].includes(STACKTRACE_PREFIX_TEXT); i++) {}
    return i;
  }

  _extractStackTrace(logLines, i) {
    if (i < logLines.length) {
      logLines[i] = logLines[i].replace(STACKTRACE_PREFIX_TEXT, '');
    }

    let stackTrace = '';
    for (
      ; i < logLines.length
        && logLines[i].trim()
        && !logLines[i].includes(INSTRUMENTATION_LOGS_PREFIX)
      ; i++) {
      stackTrace = stackTrace.concat(logLines[i], '\n');
    }
    return stackTrace;
  }
}

module.exports = {
  InstrumentationLogsParser
};
