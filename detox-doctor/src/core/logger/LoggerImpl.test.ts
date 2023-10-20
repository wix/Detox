import type { Debugger } from 'debug';
import { memoize } from 'lodash';

import type { LoggerImpl } from './LoggerImpl';

describe('LoggerImpl', () => {
  let debug: jest.Mock<Debugger>;

  let logger: LoggerImpl;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.mock('debug', () => memoize(() => jest.fn()));
    debug = jest.requireMock('debug');

    const Logger = jest.requireActual('./LoggerImpl').LoggerImpl;
    logger = new Logger({ name: 'test' });
  });

  test('should log messages', () => {
    const message = 'log message';
    logger.log(message);

    expect(console.log).toHaveBeenCalledWith(message);
  });

  test('should debug messages', () => {
    const message = 'debug message';
    logger.debug(message);

    expect(debug(`test`)).toHaveBeenCalledWith(message);
  });

  test('should create a child logger with the correct namespace', () => {
    const childName = 'childLogger';
    const childLogger = logger.child(childName);

    const message = 'debug message';
    childLogger.debug(message);

    expect(debug(`test`)).not.toHaveBeenCalledWith(message);
    expect(debug(`test:${childName}`)).toHaveBeenCalledWith(message);
  });
});
