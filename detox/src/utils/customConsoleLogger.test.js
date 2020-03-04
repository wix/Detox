const ignored = expect.anything;

describe('customConsoleLogger', () => {
  let bunyanLogger;

  beforeEach(() => {
    jest.unmock('./callsites');

    bunyanLogger = {
      mock: jest.fn(),
    };
  });

  afterEach(() => {
    delete console.__log;
  });

  it('should log an event as the prefix', () => {
    const logger = require('./customConsoleLogger');
    logger.override('__log', bunyanLogger.mock);
    console.__log();

    expect(bunyanLogger.mock).toHaveBeenCalledWith({ event: 'USER_LOG' }, ignored(), ignored(), ignored());
  });

  it('should log multiple args', () => {
    const logger = require('./customConsoleLogger');
    logger.override('__log', bunyanLogger.mock);
    console.__log('Testing123');

    expect(bunyanLogger.mock).toHaveBeenCalledWith(ignored(), ignored(), ignored(), 'Testing123');
  });

  it('should support string formatting', () => {
    const logger = require('./customConsoleLogger');
    logger.override('__log', bunyanLogger.mock);
    console.__log('Tada! this %s', 'worx');

    expect(bunyanLogger.mock).toHaveBeenCalledWith(ignored(), ignored(), ignored(), 'Tada! this worx');
  });

  it('should include log origin', () => {
    mockCallsites({file: 'mockfilename', line: 'mocklinenumber', col: 'mockcolnumber'});

    const expectedOrigin = 'mockfilename:mocklinenumber:mockcolnumber';

    const logger = require('./customConsoleLogger');
    logger.override('__log', bunyanLogger.mock);
    console.__log('');

    expect(bunyanLogger.mock).toHaveBeenCalledWith(ignored(), expect.stringContaining(expectedOrigin), ignored(), ignored());
  });

  it('should use relative file-name rather than absolute in origin', () => {
    const expectedOrigin = 'at src/utils/customConsoleLogger.test.js:';

    const logger = require('./customConsoleLogger');
    logger.override('__log', bunyanLogger.mock);
    console.__log('');

    expect(bunyanLogger.mock).toHaveBeenCalledWith(ignored(), expect.stringContaining(expectedOrigin), ignored(), ignored());
  });

  it('should handle missing file line/column in origin', () => {
    mockCallsites({file: 'mockfilename', line: undefined, col: undefined});

    const logger = require('./customConsoleLogger');
    logger.override('__log', bunyanLogger.mock);
    console.__log('');

    expect(bunyanLogger.mock).toHaveBeenCalledWith(ignored(), expect.stringContaining('mockfilename:?:?'), ignored(), ignored());
  });

  it('should support assertion logging', () => {
    const logger = require('./customConsoleLogger');
    logger.overrideAssertion('__log', bunyanLogger.mock);
    console.__log(false, 'Testing456');

    expect(bunyanLogger.mock).toHaveBeenCalledWith({ event: 'USER_LOG' }, ignored(), ignored(), 'Testing456');
  });

  it('should limit assertion logging to false-conditions', () => {
    const logger = require('./customConsoleLogger');
    logger.overrideAssertion('__log', bunyanLogger.mock);
    console.__log(true, 'Testing456');

    expect(bunyanLogger.mock).not.toHaveBeenCalled();
  });

  it('should support trace-logging', () => {
    const logger = require('./customConsoleLogger');
    logger.overrideTrace('__log', bunyanLogger.mock);
    console.__log('Testing789');

    expect(bunyanLogger.mock).toHaveBeenCalledWith({ event: 'USER_LOG' }, ignored(), ignored(), 'Testing789', '\n', ignored());
  });

  it('should log stacktrace when trace-logging', () => {
    mockCallsites2(
      {file: 'mockfilename1', func: 'mockfunc1', line: 'l1', col: 'c1'},
      {file: 'mockfilename2', func: 'mockfunc2', line: 'l2', col: 'c2'},
    );

    const logger = require('./customConsoleLogger');
    logger.overrideTrace('__log', bunyanLogger.mock);
    console.__log('');

    const stacktrace = bunyanLogger.mock.mock.calls[0][5];
    const stackLines = stacktrace.split('\n');
    expect(stackLines[0]).toEqual('\r    at mockfunc1 (mockfilename1:l1:c1)');
    expect(stackLines[1]).toEqual('\r    at mockfunc2 (mockfilename2:l2:c2)');
  });

  it('should use <unknown> marker in stack-trace where function name is not available', () => {
    mockCallsites({file: 'mockfilename', func: undefined, line: 'l', col: 'c'});

    const logger = require('./customConsoleLogger');
    logger.overrideTrace('__log', bunyanLogger.mock);
    console.__log('');

    const stacktrace = bunyanLogger.mock.mock.calls[0][5];
    expect(stacktrace).toEqual(expect.stringContaining('at <unknown>'));
  });

  it('should use <unknown> marker in stack-trace where file name is not available', () => {
    mockCallsites({file: undefined, func: 'mockfuncname', line: 'l', col: 'c'});

    const logger = require('./customConsoleLogger');
    logger.overrideTrace('__log', bunyanLogger.mock);
    console.__log('');

    const stacktrace = bunyanLogger.mock.mock.calls[0][5];
    expect(stacktrace).toEqual(expect.stringContaining('at mockfuncname (<unknown>)'));
  });

  it('should handle missing file line/column in stacktrace', () => {
    mockCallsites({func: 'mockfuncname', file: 'mockfilename', line: undefined, col: undefined});

    const logger = require('./customConsoleLogger');
    logger.overrideTrace('__log', bunyanLogger.mock);
    console.__log('');

    const stacktrace = bunyanLogger.mock.mock.calls[0][5];
    expect(stacktrace).toEqual(expect.stringContaining('at mockfuncname (mockfilename:?:?)'));
  });

  it('should override all levels', () => {
    const bunyanLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const _console = console;

    try {
      global.console = {};

      const logger = require('./customConsoleLogger');
      logger.overrideAllLevels(bunyanLogger);

      expect(console.debug).toEqual(expect.any(Function));
      expect(console.log).toEqual(expect.any(Function));
      expect(console.warn).toEqual(expect.any(Function));
      expect(console.error).toEqual(expect.any(Function));
      expect(console.trace).toEqual(expect.any(Function));
      expect(console.assert).toEqual(expect.any(Function));
    } finally {
      global.console = _console;
    }
  });

  const mockCallsites = (callsite) => {
    const mockCallsite = mockACallsite(callsite);
    jest.mock('./callsites', () => jest.fn().mockReturnValue([{}, {}, mockCallsite]));
  };

  const mockCallsites2 = (callsite1, callsite2) => {
    const mockCallsite1 = mockACallsite(callsite1);
    const mockCallsite2 = mockACallsite(callsite2);
    jest.mock('./callsites', () => jest.fn().mockReturnValue([{}, {}, mockCallsite1, mockCallsite2]));
  };

  const mockACallsite = ({func, file, line, col}) => ({
    getFunctionName: jest.fn().mockReturnValue(func || ''),
    getFileName: jest.fn().mockReturnValue(file || ''),
    getLineNumber: jest.fn().mockReturnValue(line),
    getColumnNumber: jest.fn().mockReturnValue(col),
  });
});
