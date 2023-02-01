describe('Instrumentation logs parser', () => {
  describe('stack trace parser', () => {
    let uut;
    beforeEach(() => {
      const { InstrumentationLogsParser } = require('./InstrumentationLogsParser');
      uut = new InstrumentationLogsParser();
    });

    it('should query stacktrace for false for a no-string', () => {
      const logsDump = '';
      uut.parse(logsDump);
      expect(uut.containsStackTraceLog()).toEqual(false);
    });

    it('should query stacktrace for true for a log matching the stacktrace prefix', () => {
      const logsDump = 'INSTRUMENTATION_STATUS: stack=\n\n';
      uut.parse(logsDump);
      expect(uut.containsStackTraceLog()).toEqual(true);
    });

    it('should query stacktrace for true for a log that holds the stacktrace prefix alongside other stuff', () => {
      const logsDump = [
        'INSTRUMENTATION_STATUS: stream=\ncom.example.DetoxTest\n',
        'INSTRUMENTATION_STATUS: stack=stackFrame1\n\tstackFrame2\n\n',
        'INSTRUMENTATION_STATUS: id=AndroidJUnitRunner\n',
      ].join('');
      uut.parse(logsDump);
      expect(uut.containsStackTraceLog()).toEqual(true);
    });

    it('should return empty stacktrace for a no-string', () => {
      const logsDump = '';
      uut.parse(logsDump);
      expect(uut.getStackTrace(logsDump)).toEqual('');
    });

    it('should return stacktrace for a stack-trace logs dump', () => {
      const logsDump = 'INSTRUMENTATION_STATUS: stack=stackFrame1\n\tstackFrame2\n\n';
      uut.parse(logsDump);
      expect(uut.getStackTrace(logsDump)).toEqual('stackFrame1\n\tstackFrame2\n');
    });

    it('should return stacktrace for a multi-content logs dump', () => {
      const logsDump = [
        'INSTRUMENTATION_STATUS: stream=\ncom.example.DetoxTest\n',
        'INSTRUMENTATION_STATUS: stack=stackFrame1\n\tstackFrame2\n\n',
        'INSTRUMENTATION_STATUS_CODE: 1\n',
        'INSTRUMENTATION_STATUS: id=AndroidJUnitRunner\n',
      ].join('');

      uut.parse(logsDump);
      expect(uut.getStackTrace()).toEqual('stackFrame1\n\tstackFrame2\n');
    });

    it('should return stacktrace for a stack split across 2 log dumps', () => {
      const logsDump1 = [
        'INSTRUMENTATION_STATUS: stream=\ncom.example.DetoxTest\n',
        'INSTRUMENTATION_STATUS: stack=stackFrame1\n',
      ].join('');
      const logsDump2 = [
        '\tstackFrame2\n\n',
        'INSTRUMENTATION_STATUS_CODE: 1\n',
      ].join('');

      uut.parse(logsDump1);
      uut.parse(logsDump2);
      expect(uut.getStackTrace()).toEqual('stackFrame1\n\tstackFrame2\n');
    });

    it('should return stacktrace for a split-stack cut in prefix', () => {
      const logsDump1 = [
        'INSTRUMENTATION_STATUS: stream=\ncom.example.DetoxTest\n',
        'INSTRUM',
      ].join('');
      const logsDump2 = [
        'ENTATION_STATUS: stack=stackFrame1\n\tstackFrame2\n\n',
        'INSTRUMENTATION_STATUS_CODE: 1\n',
      ].join('');

      uut.parse(logsDump1);
      uut.parse(logsDump2);
      expect(uut.getStackTrace()).toEqual('stackFrame1\n\tstackFrame2\n');
    });
  });
});
