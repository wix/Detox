jest.unmock('./DetoxLogger');
jest.useFakeTimers({
  doNotFake: ['setTimeout', 'clearTimeout'],
  now: new Date(2023, 0, 1),
});

const os = require('os');

const fs = require('fs-extra');
const _ = require('lodash');
const tempfile = require('tempfile');

const sleep = require('../utils/sleep');

jest.retryTimes(2);

describe('DetoxLogger', () => {
  //#region --- Setup ---

  /** @type {typeof import('./DetoxLogger')} */
  let DetoxLogger;
  /** @type {import('./DetoxLogger')[]} */
  let _loggerInstances = [];
  /** @type {string} */
  let jsonlLogPath;
  /** @type {string} */
  let plainLogPath;
  /** @type {Promise} */
  let safetyTimeout;

  /**
   * @param {{
   *   level?: Detox.DetoxLogLevel;
   *   overrideConsole?: boolean;
   *   options?: import('bunyan-debug-stream').BunyanDebugStreamOptions;
   * }} [opts]
   * @returns {import('./DetoxLogger')}
   */
  function logger(opts = {}) {
    const { level = 'trace', overrideConsole = false, options } = opts;
    DetoxLogger = require('./DetoxLogger');

    const instance = new DetoxLogger({
      file: jsonlLogPath,
      userConfig: {
        level,
        overrideConsole,
        options: {
          ...DetoxLogger.defaultOptions({ level }),
          colors: false,
          // @ts-ignore
          out: fs.createWriteStream(plainLogPath),
          ...options,
        },
      },
    });

    _loggerInstances = _loggerInstances || [];
    _loggerInstances.push(instance);
    return instance;
  }

  let _env;

  function setupSuite() {
    _env = process.env;
    process.env = { ..._env, FORCE_COLOR: '0' };
    jsonlLogPath = tempfile('.jsonl');
    plainLogPath = tempfile('.log');
    safetyTimeout = null;
  }

  async function teardownSuite() {
    process.env = _env;

    await Promise.all(_loggerInstances.map((logger) => logger.close()));
    _loggerInstances = [];

    fs.removeSync(jsonlLogPath);
    fs.removeSync(plainLogPath);
  }

  async function jsonl() {
    safetyTimeout = safetyTimeout || sleep(10);
    await safetyTimeout;
    const contents = await fs.readFile(jsonlLogPath, 'utf8');
    return contents.split('\n').filter(Boolean).map(line => JSON.parse(line));
  }

  async function txt() {
    safetyTimeout = safetyTimeout || sleep(10);
    await safetyTimeout;
    const contents = await fs.readFile(plainLogPath, 'utf8');
    return contents.trim()
      .replace(/detox\[\d+\]/g, 'detox[PID]');
  }

  //#endregion

  describe('- main functionality -', () => {
    beforeEach(setupSuite);
    afterEach(teardownSuite);

    it('should log messages simultaneously to plain text and JSONL', async () => {
      logger().info('Hello, world!');

      await expect(txt()).resolves.toBe(`00:00:00.000 detox[PID] i  Hello, world!`);
      await expect(jsonl()).resolves.toEqual([
        expect.objectContaining({
          hostname: os.hostname(),
          level: 30,
          msg: 'Hello, world!',
          name: 'detox',
          ph: 'i',
          pid: process.pid,
          tid: 0,
          time: new Date().toISOString(),
          v: 0,
        })
      ]);
    });

    it('should have a log level getter', () => {
      expect(logger().level).toBe('trace'); // set in tests
    });

    it('should cast non-standard log levels to the closest standard level', async () => {
      const LoggerClass = logger().constructor;
      expect(LoggerClass).toBe(DetoxLogger);
      expect(DetoxLogger.castLevel('trace')).toBe('trace');
      expect(DetoxLogger.castLevel('debug')).toBe('debug');
      expect(DetoxLogger.castLevel('verbose')).toBe('debug');
      expect(DetoxLogger.castLevel('info')).toBe('info');
      expect(DetoxLogger.castLevel('warn')).toBe('warn');
      expect(DetoxLogger.castLevel('error')).toBe('error');
      expect(DetoxLogger.castLevel('fatal')).toBe('fatal');
      expect(DetoxLogger.castLevel('unknown')).toBe('info');
    });

    it('should be able to create a child logger', async () => {
      const parent = logger();
      const child1 = parent.child({ cat: 'child1' });
      const child2 = parent.child({ cat: 'child2' });

      parent.info({ __filename }, 'Message from parent');
      child1.info('Message from child1');
      child2.info('Message from child2');

      await expect(jsonl()).resolves.toEqual([
        expect.objectContaining({ msg: 'Message from parent', __filename: 'DetoxLogger.test.js' }),
        expect.objectContaining({ cat: 'child1', msg: 'Message from child1' }),
        expect.objectContaining({ cat: 'child2', msg: 'Message from child2' }),
      ]);
    });

    it('should be able to merge categories', async () => {
      const root = logger();
      const parent = root.child({ cat: '' });
      const child = parent.child({ cat: ['test', 'child'] });
      const grandchild = child.child({ cat: 'test,grandchild' });
      const troublemaker = grandchild.child({ cat: '' });

      parent.info('Message from parent');
      child.info('Message from child');
      grandchild.info('Message from grandchild');
      troublemaker.info('Cannot reset the categories');

      const actual = await jsonl();

      expect(actual).toEqual([
        expect.objectContaining({ msg: 'Message from parent' }),
        expect.objectContaining({ cat: 'test,child', msg: 'Message from child' }),
        expect.objectContaining({ cat: 'test,child,grandchild', msg: 'Message from grandchild' }),
        expect.objectContaining({ cat: 'test,child,grandchild', msg: 'Cannot reset the categories' }),
      ]);

      expect(actual[0]).not.toHaveProperty('cat');
    });

    it('should hide messages with a lower log level in the plain output', async () => {
      logger({ level: 'warn' }).info('Hello, world!');

      await expect(txt()).resolves.toBe('');
      await expect(jsonl()).resolves.toEqual([
        expect.objectContaining({ msg: 'Hello, world!', level: 30 }),
      ]);
    });

    it('should log complete duration events', async () => {
      const l = logger();

      const syncValue = l.info.complete({ extra: 'data' }, 'Info duration', 42);
      expect(syncValue).toBe(42);

      const asyncValue = l.warn.complete('Warn duration', sleep(0).then(() => 84));
      expect(asyncValue).toBeInstanceOf(Promise);
      expect(await asyncValue).toBe(84);

      const syncResult = l.debug.complete('Debug duration', () => 126);
      expect(syncResult).toBe(126);

      const asyncResult = l.trace.complete('Trace duration', sleep(0).then(() => 168));
      expect(asyncResult).toBeInstanceOf(Promise);
      expect(await asyncResult).toBe(168);

      const promiseLike = { then: jest.fn() };
      const promiseLikeResult = l.fatal.complete('Fatal (pending)', promiseLike);
      expect(promiseLikeResult).toBe(promiseLike);

      try {
        l.error.complete('Error duration (sync)', () => { throw anError('Oops (sync)!'); });
      } catch (e) {}

      await l.error.complete('Error duration (async)', sleep(0).then(() => {
        throw anError('Oops (async)!');
      })).catch(() => {});

      const jsonlOutput = await jsonl();
      const time = new Date().toISOString();
      const tid = 0;

      expect(jsonlOutput).toEqual([
        expect.objectContaining({ msg: 'Info duration', ph: 'B', time, tid, level: 30, extra: 'data' }),
        expect.objectContaining({ ph: 'E', time, tid, level: 30, success: true }),
        expect.objectContaining({ msg: 'Warn duration', ph: 'B', time, tid, level: 40 }),
        expect.objectContaining({ ph: 'E', time, tid, level: 40, success: true }),
        expect.objectContaining({ msg: 'Debug duration', ph: 'B', time, tid, level: 20 }),
        expect.objectContaining({ ph: 'E', time, tid, level: 20, success: true }),
        expect.objectContaining({ msg: 'Trace duration', ph: 'B', time, tid, level: 10 }),
        expect.objectContaining({ ph: 'E', time, tid, level: 10, success: true }),
        expect.objectContaining({ msg: 'Fatal (pending)', ph: 'B', time, tid, level: 60 }),
        expect.objectContaining({ msg: 'Error duration (sync)', ph: 'B', time, tid, level: 50 }),
        expect.objectContaining({ ph: 'E', time, tid, level: 50, success: false, error: expect.any(String) }),
        expect.objectContaining({ msg: 'Error duration (async)', ph: 'B', time, tid, level: 50 }),
        expect.objectContaining({ ph: 'E', time, tid, level: 50, success: false, error: expect.any(String) }),
      ]);

      await expect(txt()).resolves.toMatchSnapshot();
    });

    it('should log begin/end duration events', async () => {
      const l = logger({
        options: { showLevel: true }
      }).child({ cat: 'duration' });
      const activity1 = l.child({ id: 'thread1' });
      const activity2 = l.child({ id: 'thread2' });

      activity1.info.begin({ meta: 'data' }, 'Activity 1 start');
      activity2.error.begin('Activity 2');
      activity1.debug.end({ success: true }, 'Activity 1 start');
      activity2.warn.end();

      activity2.fatal.end(); // testing the fallback, when there is no begin event

      await expect(txt()).resolves.toMatchSnapshot();
    });

    it('should log end duration events correctly for different categories', async () => {
      const parent = logger();
      const cat1 = parent.child({ cat: 'cat1' });
      const cat2 = parent.child({ cat: 'cat2' });

      cat1.info.begin('Activity 1 start');
      cat2.info.begin('Activity 2 start');
      cat1.info.end();
      cat2.info.end();

      await expect(txt()).resolves.toMatchSnapshot();
    });

    it.each([
      ['trace'],
      ['debug'],
      ['info'],
      ['warn'],
      ['error'],
      ['fatal'],
    ])('should format messages according to the log level: %s', async (level) => {
      // @ts-ignore
      const l = logger({ level });
      const err = anError('Some test err details');
      const error = anError('Some test error details');

      l.fatal('BLUE SCREEN OF DEATH');
      l.error({ origin: 'module1', error }, 'An error occurred:');
      l.error({ origin: 'module2', err }, 'An err (alias) occurred:');
      l.error(anError('Error as context'), 'Another error occurred:');
      l.warn({ origin: 'some-module/index.js', stack: 'at index.js:30:73' }, 'Warning message!');
      l.debug({ cat: 'custom-category', event: 'MESSAGE', data: { foo: 'bar' } }, 'A message with a payload');
      l.debug({ cat: 'custom-category', data: 'raw string data' }, 'One more message with a payload');
      l.trace({ cat: 'custom-category', event: 'MESSAGE' }, 'Trace message');
      l.trace({ args: ['stringArgument', { prop: 'value' }] }, 'someMethodCall');

      await expect(txt()).resolves.toMatchSnapshot();
    });

    it('should allow customizing prefixers and stringifiers', async () => {
      const l = logger({
        options: {
          showPrefixes: (p) => `[${p.join(', ')}]`,
          prefixers: {
            cat: (cat) => cat.toUpperCase(),
          },
          stringifiers: {
            args: (args) => `${args.length}`,
          },
        },
      });

      l.trace({ cat: 'custom-category', args: [10, 20], }, 'Trace message');
      expect(await txt()).toBe('00:00:00.000 detox[PID] [CUSTOM-CATEGORY] Trace message\n  args: 2');
    });
  });

  describe('- overriding console -', () => {
    const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug', 'trace', 'assert'];
    const LOGGER_METHODS =  ['info', 'info', 'warn', 'error', 'debug', 'info', 'error'];

    let loggerInstance;
    let spiedConsoleMethods;

    describe('when overrideConsole is true', () => {
      beforeAll(setupSuite);
      beforeAll(spyOnLoggerAndConsoleMethods);
      beforeAll(() => loggerInstance.setConfig({ overrideConsole: true }));
      afterAll(teardownSuite);

      it.each([
        ['log', 'info'],
        ['info', 'info'],
        ['warn', 'warn'],
        ['error', 'error'],
        ['debug', 'debug'],
      ])('should override console.%s with logger.%s', (consoleMethodName, loggerMethodName) => {
        console[consoleMethodName](`${consoleMethodName}(%s)`, 'foo');

        expect(spiedConsoleMethods[consoleMethodName]).not.toHaveBeenCalled();
        expect(loggerInstance[loggerMethodName]).toHaveBeenCalledWith(expect.objectContaining({
          cat: 'user',
          origin: expect.any(String),
        }), `${consoleMethodName}(foo)`);
      });

      it('should override console.trace with logger.info', () => {
        console.trace(`trace(%s)`, 'foo');

        expect(spiedConsoleMethods.trace).not.toHaveBeenCalled();
        expect(loggerInstance.info).toHaveBeenCalledWith(expect.objectContaining({
          cat: 'user',
          origin: expect.any(String),
          stack: expect.any(String),
        }), `trace(foo)`);
      });

      it('should override console.assert with logger.error', () => {
        console.assert(false, `Assertion failed: %s`, 'foo');

        expect(spiedConsoleMethods.assert).not.toHaveBeenCalled();
        expect(loggerInstance.error).toHaveBeenCalledWith(expect.objectContaining({
          cat: 'user',
          origin: expect.any(String),
        }), 'AssertionError:', `Assertion failed: foo`);
      });
    });

    describe('when overrideConsole is false', () => {
      beforeAll(setupSuite);
      beforeAll(spyOnLoggerAndConsoleMethods);
      beforeAll(() => loggerInstance.setConfig({ overrideConsole: false }));
      afterAll(teardownSuite);

      it.each(CONSOLE_METHODS)('should not override console.%s', (consoleMethodName) => {
        const loggerMethod = LOGGER_METHODS[CONSOLE_METHODS.indexOf(consoleMethodName)];
        console[consoleMethodName](`${consoleMethodName}(%s)`, 'foo');

        expect(loggerInstance[loggerMethod]).not.toHaveBeenCalled();
        expect(spiedConsoleMethods[consoleMethodName]).toHaveBeenCalledWith(`${consoleMethodName}(%s)`, 'foo');
      });
    });

    function spyOnLoggerAndConsoleMethods() {
      spiedConsoleMethods = {};
      loggerInstance = logger();

      for (const methodName of _.uniq(LOGGER_METHODS)) {
        jest.spyOn(loggerInstance, methodName);
      }

      for (const methodName of CONSOLE_METHODS) {
        // @ts-ignore
        jest.spyOn(console, methodName);
        spiedConsoleMethods[methodName] = console[methodName];
      }
    }
  });

  describe('- unhappy paths -', () => {
    beforeEach(setupSuite);
    afterEach(teardownSuite);

    it('should not allow setting config in a child logger', async () => {
      await expect(logger().child().setConfig({ level: 'info' })).rejects.toThrowError(/Trying to set a config in a non-root logger/);
    });

    it('should not allow closing the entire logging capability from a child logger', async () => {
      await expect(logger().child().close()).rejects.toThrowError(/Trying to close file streams from a non-root logger/);
    });

    it('should escape properties conflicting with Bunyan internal ones', async () => {
      logger().info({
        hostname: 'hostname',
        level: 'level',
        msg: 'msg',
        name: 'name',
        pid: 'pid',
        tid: 'tid',
        ph: 'M',
        time: 'time',
        custom: 'property',
      }, 'A very bad message');

      await expect(jsonl()).resolves.toEqual( [{
        custom: 'property',
        hostname: os.hostname(),
        hostname$: 'hostname',
        level$: 'level',
        level: 30,
        msg: 'A very bad message',
        msg$: 'msg',
        name: 'detox',
        name$: 'name',
        pid: expect.any(Number),
        pid$: 'pid',
        ph: 'i',
        ph$: 'M',
        tid: 0,
        tid$: 'tid',
        time: new Date().toISOString(),
        time$: 'time',
        v: 0,
      }]);
    });

    it('should allow creating a logger without a config', async () => {
      const DetoxLogger = require('./DetoxLogger');
      const noopFilePath = os.platform() === 'win32' ? 'nul' : '/dev/null';
      const instance = new DetoxLogger({ file: noopFilePath });

      expect(instance.config).toEqual({
        level: 'info',
        overrideConsole: false,
        options: expect.objectContaining({
          showDate: false,
          showLevel: false,
          showLoggerName: false,
          showMetadata: false,
          showPid: false,
          showPrefixes: false,
          showProcess: false,
        }),
      });
    });
  });

  function anError(msg) {
    const err = new Error(msg);
    err.stack = '';
    return err;
  }
});
