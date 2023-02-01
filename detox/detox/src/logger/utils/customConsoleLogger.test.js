describe('customConsoleLogger', () => {
  let overrideConsoleMethods;
  let restoreConsoleMethods;
  let fakeConsole, bunyanLogger;

  beforeEach(() => {
    overrideConsoleMethods = require('./customConsoleLogger').overrideConsoleMethods;
    restoreConsoleMethods = require('./customConsoleLogger').restoreConsoleMethods;

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
    const expectedOrigin = {
      cat: 'user',
      origin: expect.stringMatching(/at src[\\/]logger[\\/]utils[\\/]customConsoleLogger\.test\.js:\d+:\d+/)
    };

    const expectedStackDump = {
      cat: 'user',
      stack: expect.stringMatching(/at.*src[\\/]logger[\\/]utils[\\/]customConsoleLogger\.test\.js:\d+:\d+/m)
    };

    beforeEach(() => {
      overrideConsoleMethods(fakeConsole, bunyanLogger);
    });

    it('should connect: console.log -> logger.info', () => {
      fakeConsole.log('OK %d', 200);
      expect(bunyanLogger.info).toHaveBeenCalledWith(expectedOrigin, 'OK 200');
    });

    it('should connect: console.info -> logger.info', () => {
      fakeConsole.info('OK %d', 200);
      expect(bunyanLogger.info).toHaveBeenCalledWith(expectedOrigin, 'OK 200');
    });

    it('should connect: console.warn -> logger.warn', () => {
      fakeConsole.warn('Warning %d', 301);
      expect(bunyanLogger.warn).toHaveBeenCalledWith(expectedOrigin, 'Warning 301');
    });

    it('should connect: console.trace -> logger.info', () => {
      fakeConsole.trace('TraceMe %d', 100500);
      expect(bunyanLogger.info).toHaveBeenCalledWith({ ...expectedOrigin, ...expectedStackDump }, 'TraceMe 100500');
    });

    it('should connect: console.error -> logger.error', () => {
      fakeConsole.error('MyError %d', 500);
      expect(bunyanLogger.error).toHaveBeenCalledWith(expectedOrigin, 'MyError 500');
    });

    it('should connect: console.debug -> logger.debug', () => {
      fakeConsole.debug('Debug %d', 0);
      expect(bunyanLogger.debug).toHaveBeenCalledWith(expectedOrigin, 'Debug 0');
    });

    it('should connect: console.assert -> logger.error', () => {
      fakeConsole.assert(false, 'Failed condition %s', false);
      expect(bunyanLogger.error).toHaveBeenCalledWith(expectedOrigin, 'AssertionError:', 'Failed condition false');
    });

    it('should not connect console.assert to logger.error, if the condition is true', () => {
      fakeConsole.assert(true, 'Nothing to say');
      expect(bunyanLogger.error).not.toHaveBeenCalled();
    });
  });

  describe('- restoring the override -', () => {
    it('should not throw if the console is not overridden', () => {
      expect(() => restoreConsoleMethods(fakeConsole)).not.toThrow();
    });

    it('should work if the console has been overridden', () => {
      const originalMethods = Object.values(fakeConsole);
      overrideConsoleMethods(fakeConsole, bunyanLogger);
      const overridenMethods = Object.values(fakeConsole);
      restoreConsoleMethods(fakeConsole);
      const restoredMethods = Object.values(fakeConsole);

      expect(restoredMethods).toEqual(originalMethods);
      expect(originalMethods).not.toEqual(overridenMethods);
    });
  });
});
