describe('customConsoleLogger.overrideConsoleMethods(console, bunyanLogger)', () => {
  let overrideConsoleMethods;
  let fakeConsole, bunyanLogger;

  const USER_LOG_EVENT = { event: 'USER_LOG' };

  beforeEach(() => {
    overrideConsoleMethods = require('./customConsoleLogger').overrideConsoleMethods;

    fakeConsole = {
      log: jest.fn(),
      warn: jest.fn(),
      trace: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      assert: jest.fn(),
    };

    bunyanLogger = {
      debug: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };
  });

  describe('- override safety -', () => {
    it('should override console methods, if it has no internal property __detox_log__', () => {
      expect(overrideConsoleMethods({ ...fakeConsole }, bunyanLogger)).not.toEqual(fakeConsole);
    });

    it('should not override console methods, if it has an internal property __detox_log__', () => {
      fakeConsole.__detox_log__ = {};
      expect(overrideConsoleMethods({ ...fakeConsole }, bunyanLogger)).toEqual(fakeConsole);
    });

    it('should set an internal property __detox_log__ after override', () => {
      expect(overrideConsoleMethods({ ...fakeConsole }, bunyanLogger).__detox_log__).toBeDefined();
    });
  });

  describe('- proxying to bunyan -', () => {
    const expectedOrigin = expect.stringMatching(/at src[\\/]utils[\\/]customConsoleLogger\.test\.js:\d+:\d+/);
    const expectedStackDump = expect.stringMatching(/at.*src[\\/]utils[\\/]customConsoleLogger\.test\.js:\d+:\d+/m);

    beforeEach(() => {
      overrideConsoleMethods(fakeConsole, bunyanLogger);
    });

    it('should connect: console.log -> logger.info', () => {
      fakeConsole.log('OK %d', 200);
      expect(bunyanLogger.info).toHaveBeenCalledWith(USER_LOG_EVENT, expectedOrigin, '\n', 'OK 200');
    });

    it('should connect: console.warn -> logger.warn', () => {
      fakeConsole.warn('Warning %d', 301);
      expect(bunyanLogger.warn).toHaveBeenCalledWith(USER_LOG_EVENT, expectedOrigin, '\n', 'Warning 301');
    });

    it('should connect: console.trace -> logger.info', () => {
      fakeConsole.trace('TraceMe %d', 100500);
      expect(bunyanLogger.info).toHaveBeenCalledWith(USER_LOG_EVENT, expectedOrigin, '\n  Trace:', 'TraceMe 100500', expectedStackDump);
    });

    it('should connect: console.error -> logger.error', () => {
      fakeConsole.error('MyError %d', 500);
      expect(bunyanLogger.error).toHaveBeenCalledWith(USER_LOG_EVENT, expectedOrigin, '\n', 'MyError 500');
    });

    it('should connect: console.debug -> logger.debug', () => {
      fakeConsole.debug('Debug %d', 0);
      expect(bunyanLogger.debug).toHaveBeenCalledWith(USER_LOG_EVENT, expectedOrigin, '\n', 'Debug 0');
    });

    it('should connect: console.assert -> logger.error', () => {
      fakeConsole.assert(false, 'Failed condition %s', false);
      expect(bunyanLogger.error).toHaveBeenCalledWith(USER_LOG_EVENT, expectedOrigin, '\n  AssertionError:', 'Failed condition false');
    });

    it('should not connect console.assert to logger.error, if the condition is true', () => {
      fakeConsole.assert(true, 'Nothing to say');
      expect(bunyanLogger.error).not.toHaveBeenCalled();
    });
  });
});
