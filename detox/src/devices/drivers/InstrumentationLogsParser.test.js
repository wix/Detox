describe('Instrumentation logs parser', () => {
  describe('stack trace parser', () => {
    let uut;
    beforeEach(() => {
      const { InstrumentationLogsParser } = require('./InstrumentationLogsParser');
      uut = new InstrumentationLogsParser();
    });

    it('should query stacktrace for false for a no-string', () => {
      const logsDump = '';
      expect(uut.hasStackTraceLog(logsDump)).toEqual(false);
    });

    it('should query stacktrace for true for a log matching the stacktrace prefix', () => {
      const logsDump = 'INSTRUMENTATION_STATUS: stack=';
      expect(uut.hasStackTraceLog(logsDump)).toEqual(true);
    });

    it('should query stacktrack for true for a log that holds the stacktrace prefix alongside other stuff', () => {
      const logsDump = [
        'INSTRUMENTATION_STATUS: stream=\ncom.example.DetoxTest',
        'INSTRUMENTATION_STATUS: stack=stackFrame1\n    stackFrame2',
        'INSTRUMENTATION_STATUS: id=AndroidJUnitRunner',
      ].join('\n');
      expect(uut.hasStackTraceLog(logsDump)).toEqual(true);
    });

    it('should return empty stacktrace for a no-string', () => {
      const logsDump = '';
      expect(uut.getStackTrace(logsDump)).toEqual('');
    });

    it('should return stacktrace for a stack-trace logs dump', () => {
      const logsDump = 'INSTRUMENTATION_STATUS: stack=stackFrame1\n    stackFrame2\n';
      expect(uut.getStackTrace(logsDump)).toEqual('stackFrame1\n    stackFrame2\n');
    });

    it('should return stacktrace for a multi-content logs dump', () => {
      const logsDump = [
        'INSTRUMENTATION_STATUS: stream=\ncom.example.DetoxTest',
        'INSTRUMENTATION_STATUS: stack=stackFrame1\n    stackFrame2',
        'INSTRUMENTATION_STATUS_CODE: 1',
        'INSTRUMENTATION_STATUS: id=AndroidJUnitRunner',
      ].join('\n');
      expect(uut.getStackTrace(logsDump)).toEqual('stackFrame1\n    stackFrame2\n');
    });
  });
});
