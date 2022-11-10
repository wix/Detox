jest.unmock('../DetoxLogger');
jest.useFakeTimers({
  doNotFake: [
    'nextTick',
    'performance',
    'queueMicrotask',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'requestIdleCallback',
    'cancelIdleCallback',
    'setImmediate',
    'clearImmediate',
    'setInterval',
    'clearInterval',
    'setTimeout',
    'clearTimeout',
  ],
  now: new Date(2023, 0, 1),
});

const path = require('path');
const { PassThrough } = require('stream');

const fs = require('fs-extra');
const glob = require('glob');
const tempfile = require('tempfile');

const temporary = require('../../artifacts/utils/temporaryPath');
const sleep = require('../../utils/sleep');
const DetoxLogger = require('../DetoxLogger');

const DetoxLogFinalizer = require('./DetoxLogFinalizer');

// TODO: investigate why the test fails
if (require('os').platform() === 'win32') {
  describe = describe.skip;
}

describe('DetoxLogFinalizer', () => {
  /** @type {string[]} */
  let temporaryFiles = [];
  /** @type {*} */
  let session;
  /** @type {import('./DetoxLogFinalizer')} */
  let finalizer;

  let _env;

  beforeEach(() => {
    _env = process.env;
    process.env = { ..._env, FORCE_COLOR: '0' };
  });

  beforeEach(() => {
    session = {
      id: 'session-id',
      detoxConfig: {
        artifacts: {
          rootDir: tempfile(''),
          plugins: {
            log: {
              enabled: true,
              keepOnlyFailedTestsArtifacts: false,
            }
          }
        },
        logger: {
          level: 'info',
          overrideConsole: false,
          options: {
            ...DetoxLogger.defaultOptions({
              level: 'info',
            }),
            showDate: (date) => date.toISOString(),
            colors: false,
          },
        }
      }
    };

    temporaryFiles = [session.detoxConfig.artifacts.rootDir];
    finalizer = new DetoxLogFinalizer({ session });
  });

  afterEach(async () => {
    await Promise.all(temporaryFiles.map(f => fs.remove(f)));
  });

  afterEach(() => {
    process.env = _env;
  });

  describe('finalize', () => {
    it('should not throw when there are no logs', async () => {
      await finalizer.finalize();
      expect(fs.existsSync(artifactsDir())).toBe(false);
    });

    it('should convert JSONL logs to Chrome Trace format', async () => {
      await createLogFiles();
      await finalizer.finalize();

      let plainLog = await fs.readFile(path.join(artifactsDir(), 'detox.log'), 'utf8');
      let traceLog = JSON.parse(await fs.readFile(path.join(artifactsDir(), 'detox.trace.json'), 'utf8'));

      plainLog = plainLog.replace(/detox\[\d+\]/g, 'detox[1234]');
      traceLog = traceLog.map(t => (t.pid = 1234, t));

      expect(plainLog).toMatchSnapshot();
      expect(traceLog).toMatchSnapshot();
    });

    it('should not create logs when they are disabled', async () => {
      session.detoxConfig.artifacts.plugins.log.enabled = false;
      await createLogFiles();
      await finalizer.finalize();
      expect(fs.existsSync(artifactsDir())).toBe(false);
      expect(fs.existsSync(temporaryFiles[1])).toBe(false);
      expect(fs.existsSync(temporaryFiles[2])).toBe(false);
    });

    it('should not create logs for successful run when configured', async () => {
      session.detoxConfig.artifacts.plugins.log.keepOnlyFailedTestsArtifacts = true;
      session.testResults = [{ success: true }];

      await createLogFiles();
      await finalizer.finalize();
      expect(fs.existsSync(artifactsDir())).toBe(false);
      expect(fs.existsSync(temporaryFiles[1])).toBe(false);
      expect(fs.existsSync(temporaryFiles[2])).toBe(false);
    });

    it('should create logs for failing run when configured', async () => {
      session.detoxConfig.artifacts.plugins.log.keepOnlyFailedTestsArtifacts = true;
      session.testResults = [{ success: false }];

      await createLogFiles();
      await finalizer.finalize();

      const outFiles = glob.sync(path.join(artifactsDir(), '*'));
      expect(outFiles.map(f => path.basename(f))).toEqual([
        'detox.log',
        'detox.trace.json',
      ]);
    });
  });

  describe('finalizeSync', () => {
    it('should not throw for non-initialized state', async () => {
      await createLogFiles();
      delete session.detoxConfig.artifacts.plugins;
      expect(() => finalizer.finalizeSync()).not.toThrow();

      await createLogFiles();
      delete session.detoxConfig.artifacts.rootDir;
      expect(() => finalizer.finalizeSync()).not.toThrow();

      await createLogFiles();
      delete session.detoxConfig;
      expect(() => finalizer.finalizeSync()).not.toThrow();
    });

    it('should not throw when there are no logs', async () => {
      finalizer.finalizeSync();
      expect(fs.existsSync(artifactsDir())).toBe(false);
    });

    it('should copy JSONL logs to artifacts dir', async () => {
      await createLogFiles();
      finalizer.finalizeSync();

      const outFiles = glob.sync(path.join(artifactsDir(), '*'));
      expect(outFiles.map(f => path.extname(f))).toEqual([
        '.jsonl',
        '.jsonl',
      ]);
    });

    it('should not create logs when they are disabled', async () => {
      session.detoxConfig.artifacts.plugins.log.enabled = false;
      await createLogFiles();
      finalizer.finalizeSync();
      expect(fs.existsSync(artifactsDir())).toBe(false);
      expect(fs.existsSync(temporaryFiles[1])).toBe(false);
      expect(fs.existsSync(temporaryFiles[2])).toBe(false);
    });

    it('should not create logs for successful run when configured', async () => {
      session.detoxConfig.artifacts.plugins.log.keepOnlyFailedTestsArtifacts = true;
      session.testResults = [{ success: true }];

      await createLogFiles();
      finalizer.finalizeSync();
      expect(fs.existsSync(artifactsDir())).toBe(false);
      expect(fs.existsSync(temporaryFiles[1])).toBe(false);
      expect(fs.existsSync(temporaryFiles[2])).toBe(false);
    });

    it('should create logs for failing run when configured', async () => {
      session.detoxConfig.artifacts.plugins.log.keepOnlyFailedTestsArtifacts = true;
      session.testResults = [{ success: false }];

      await createLogFiles();
      finalizer.finalizeSync();

      const outFiles = glob.sync(path.join(artifactsDir(), '*'));
      expect(outFiles.map(f => path.extname(f))).toEqual([
        '.jsonl',
        '.jsonl',
      ]);
    });
  });

  describe('createEventStream', () => {
    it('should create a stream of Chrome Trace format events', async () => {
      await createLogFiles();

      const events = [];
      await new Promise((resolve, reject) => {
        finalizer.createEventStream()
          .on('end', resolve)
          .on('error', reject)
          .on('data', event => events.push(event));
      });

      events.forEach(t => { t.pid = 1234; });

      expect(events).toMatchSnapshot();
    });
  });

  function artifactsDir() {
    return session.detoxConfig.artifacts.rootDir;
  }

  async function createLogFiles() {
    const sessionId = session.id;
    const logPath1 = temporary.for.jsonl(`${sessionId}.1`);
    const logPath2 = temporary.for.jsonl(`${sessionId}.2`);

    temporaryFiles.push(logPath1, logPath2);

    const userConfig = {
      ...session.detoxConfig.logger,
      options: {
        ...session.detoxConfig.logger.options,
        out: new PassThrough(),
      },
    };

    const log1 = new DetoxLogger({
      file: logPath1,
      userConfig,
    });

    const log2 = new DetoxLogger({
      file: logPath2,
      userConfig,
    });

    jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'));
    log1.info({ cat: 'main' }, 'msg1');

    jest.setSystemTime(new Date('2023-01-01T00:00:01.000Z'));
    log1.trace.begin({ id: 1, cat: 'parallel' }, 'duration1');

    jest.setSystemTime(new Date('2023-01-01T00:00:01.500Z'));
    log1.trace.begin({ id: 2, cat: 'parallel' }, 'duration2');

    jest.setSystemTime(new Date('2023-01-01T00:00:02.000Z'));
    log1.trace.end({ id: 1, cat: 'parallel' });

    jest.setSystemTime(new Date('2023-01-01T00:00:02.500Z'));
    log1.trace.end({ id: 2, cat: 'parallel' });

    jest.setSystemTime(new Date('2023-01-01T00:00:00.500Z'));
    log2.info.begin('long-duration');

    jest.setSystemTime(new Date('2023-01-01T00:00:01.000Z'));
    log2.debug('instant event');

    jest.setSystemTime(new Date('2023-01-01T00:00:02.250Z'));
    log2.trace.end();

    await sleep(10);
  }
});
