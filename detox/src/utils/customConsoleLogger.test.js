const path = require('path');
const ignored = expect.anything;
const customConsoleLogger = require('./customConsoleLogger');

describe('customConsoleLogger', () => {
  let fakeConsole, bunyanLogger;

  const USER_LOG_EVENT = { event: 'USER_LOG' };

  beforeEach(() => {
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

  it('should override console methods, if it has no internal property __detox_log__', () => {
    expect(customConsoleLogger.overrideConsoleMethods({ ...fakeConsole }, bunyanLogger)).not.toEqual(fakeConsole);
  });

  it('should not override console methods, if it has an internal property __detox_log__', () => {
    fakeConsole.__detox_log__ = jest.fn();
    expect(customConsoleLogger.overrideConsoleMethods({ ...fakeConsole }, bunyanLogger)).toEqual(fakeConsole);
  });

  describe('redirections', () => {
    beforeEach(() => {
      customConsoleLogger.overrideConsoleMethods(fakeConsole, bunyanLogger);
    });

    it('should connect: console.log -> logger.info', () => {
      fakeConsole.log('OK', 200);
      expect(bunyanLogger.info).toHaveBeenCalledWith(USER_LOG_EVENT, ignored(), '\n', 'OK 200');
    });

    it('should connect: console.warn -> logger.warn', () => {
      fakeConsole.warn('Warning', 301);
      expect(bunyanLogger.warn).toHaveBeenCalledWith(USER_LOG_EVENT, ignored(), '\n', 'Warning 301');
    });

    it('should connect: console.trace -> logger.info', () => {
      fakeConsole.trace('TraceMe', 100500);
      expect(bunyanLogger.info).toHaveBeenCalledWith(USER_LOG_EVENT, ignored(), '\n  Trace:', 'TraceMe 100500', ignored());
    });

    it('should connect: console.error -> logger.error', () => {
      fakeConsole.error('MyError', 500);
      expect(bunyanLogger.error).toHaveBeenCalledWith(USER_LOG_EVENT, ignored(), '\n', 'MyError 500');
    });

    it('should connect: console.debug -> logger.debug', () => {
      fakeConsole.debug('Debug', 0);
      expect(bunyanLogger.debug).toHaveBeenCalledWith(USER_LOG_EVENT, ignored(), '\n', 'Debug 0');
    });

    it('should connect: console.assert -> logger.error', () => {
      fakeConsole.assert(false, 'Failed condition', false);
      expect(bunyanLogger.error).toHaveBeenCalledWith(USER_LOG_EVENT, ignored(), '\n  AssertionError:', 'Failed condition false');
    });

    it('should not connect console.assert to logger.error, if the condition is true', () => {
      fakeConsole.assert(true, 'Nothing to say');
      expect(bunyanLogger.error).not.toHaveBeenCalled();
    });
  });


  // it('should support string formatting', () => {
  //   const logger = require('./customConsoleLogger');
  //   logger.override('__log', bunyanLogger.mock);
  //   console.__log('Tada! this %s', 'worx');

  //   expect(bunyanLogger.mock).toHaveBeenCalledWith(ignored(), ignored(), ignored(), 'Tada! this worx');
  // });

  // it('should include log origin', () => {
  //   mockCallsites({file: 'mockfilename', line: 'mocklinenumber', col: 'mockcolnumber'});

  //   const expectedOrigin = 'mockfilename:mocklinenumber:mockcolnumber';

  //   const logger = require('./customConsoleLogger');
  //   logger.override('__log', bunyanLogger.mock);
  //   console.__log('');

  //   expect(bunyanLogger.mock).toHaveBeenCalledWith(ignored(), expect.stringContaining(expectedOrigin), ignored(), ignored());
  // });

  // it('should use relative file-name rather than absolute in origin', () => {
  //   const expectedOrigin = `at ${path.normalize('src/utils/customConsoleLogger.test.js')}:`;

  //   const logger = require('./customConsoleLogger');
  //   logger.override('__log', bunyanLogger.mock);
  //   console.__log('');

  //   expect(bunyanLogger.mock).toHaveBeenCalledWith(ignored(), expect.stringContaining(expectedOrigin), ignored(), ignored());
  // });

  // it('should handle unknown file in origin', () => {
  //   mockCallsites({file: undefined, line: undefined, col: undefined});

  //   const logger = require('./customConsoleLogger');
  //   logger.override('__log', bunyanLogger.mock);
  //   console.__log('');

  //   expect(bunyanLogger.mock).toHaveBeenCalledWith(ignored(), expect.stringContaining('<unknown>:?:?'), ignored(), ignored());
  // });  
  // 
  // it('should handle missing file line/column in origin', () => {
  //   mockCallsites({file: 'mockfilename', line: undefined, col: undefined});

  //   const logger = require('./customConsoleLogger');
  //   logger.override('__log', bunyanLogger.mock);
  //   console.__log('');

  //   expect(bunyanLogger.mock).toHaveBeenCalledWith(ignored(), expect.stringContaining('mockfilename:?:?'), ignored(), ignored());
  // });

  // it('should support assertion logging', () => {
  //   const logger = require('./customConsoleLogger');
  //   logger.overrideAssertion('__log', bunyanLogger.mock);
  //   console.__log(false, 'Testing456');

  //   expect(bunyanLogger.mock).toHaveBeenCalledWith({ event: 'USER_LOG' }, ignored(), ignored(), 'Testing456');
  // });

  // it('should limit assertion logging to false-conditions', () => {
  //   const logger = require('./customConsoleLogger');
  //   logger.overrideAssertion('__log', bunyanLogger.mock);
  //   console.__log(true, 'Testing456');

  //   expect(bunyanLogger.mock).not.toHaveBeenCalled();
  // });

  // it('should support trace-logging', () => {
  //   const logger = require('./customConsoleLogger');
  //   logger.overrideTrace('__log', bunyanLogger.mock);
  //   console.__log('Testing789');

  //   expect(bunyanLogger.mock).toHaveBeenCalledWith({ event: 'USER_LOG' }, ignored(), ignored(), 'Testing789', ignored());
  // });

  // it('should log stack-trace dump when trace-logging', () => {
  //   mockCallsites();
  //   const callsites = require('./callsites');
  //   callsites.stackdump = jest.fn().mockReturnValue('mockstack\ntrace');

  //   const logger = require('./customConsoleLogger');
  //   logger.overrideTrace('__log', bunyanLogger.mock);
  //   console.__log('');

  //   expect(bunyanLogger.mock).toHaveBeenCalledWith(ignored(), ignored(), ignored(), ignored(), '\n\rmockstack\ntrace');
  // });

  // it('should override all levels', () => {
  //   const bunyanLogger = {
  //     debug: jest.fn(),
  //     info: jest.fn(),
  //     warn: jest.fn(),
  //     error: jest.fn(),
  //   };

  //   const _console = console;

  //   try {
  //     global.console = {};

  //     const logger = require('./customConsoleLogger');
  //     logger.overrideAllLevels(bunyanLogger);

  //     expect(console.debug).toEqual(expect.any(Function));
  //     expect(console.log).toEqual(expect.any(Function));
  //     expect(console.warn).toEqual(expect.any(Function));
  //     expect(console.error).toEqual(expect.any(Function));
  //     expect(console.trace).toEqual(expect.any(Function));
  //     expect(console.assert).toEqual(expect.any(Function));
  //   } finally {
  //     global.console = _console;
  //   }
  // });

  // const mockCallsites = (callsite) => {
  //   const mockCallsite = mockACallsite(callsite);
  //   jest.mock('./callsites', () => jest.fn().mockReturnValue([{}, {}, mockCallsite]));
  // };

  // const mockACallsite = ({func, file, line, col} = {}) => ({
  //   getFunctionName: jest.fn().mockReturnValue(func || ''),
  //   getFileName: jest.fn().mockReturnValue(file || ''),
  //   getLineNumber: jest.fn().mockReturnValue(line),
  //   getColumnNumber: jest.fn().mockReturnValue(col),
  // });
});
