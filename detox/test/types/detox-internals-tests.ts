declare function random<T>(): T
declare function assert<T>(x: T): void;

import {
  cleanup,
  config,
  init,
  installWorker,
  log,
  onHookFailure,
  onHookStart,
  onHookSuccess,
  onRunDescribeFinish,
  onRunDescribeStart,
  onRunFinish,
  onRunStart,
  onTestDone,
  onTestFnFailure,
  onTestFnStart,
  onTestFnSuccess,
  onTestStart,
  resolveConfig,
  session,
  uninstallWorker,
  worker,
} from 'detox/internals';

async function internalsTest() {
  const globalOptions: DetoxInternals.DetoxInitOptions = {
    cwd: __dirname,
    argv: {
      configuration: 'android.debug',
    },
    testRunnerArgv: {
      bail: true
    },
    override: {
      artifacts: {},
      devices: {},
    },
    global,
    workerId: Math.random() > 0.5 ? null : 'worker-1',
  };

  await resolveConfig();
  await resolveConfig({});
  await resolveConfig(globalOptions);

  await init();
  await init({});
  await init(globalOptions);

  await installWorker();
  await installWorker({});
  await installWorker({
    global,
    workerId: 'worker-1',
  });

  assert<DetoxInternals.Worker>(worker);

  await uninstallWorker();
  await cleanup();
}

async function logTest() {
  switch (log.level) {
    case 'fatal':
    case 'error':
    case 'warn':
    case 'info':
    case 'debug':
    case 'trace':
      break;
  }

  log.trace('msg');
  log.trace({ event: 'EVENT' }, 'msg');

  log.trace.begin('Outer section');
  log.debug.begin({ arg: 'value' }, 'Inner section');

  log.info.complete('Sync section', () => 'sync').toUpperCase();
  log.warn.complete('Async section', async () => 42).then(() => 84);
  log.error.complete('Promise section', Promise.resolve(42)).finally(() => {});
  log.fatal.complete('Value section', 42).toFixed(1);

  log.warn.end({ extra: 'data' });
  log.info.end();

  log.debug('msg');
  log.debug({ event: 'EVENT' }, 'msg');
  log.info('msg');
  log.info({ event: 'EVENT' }, 'msg');
  log.warn('msg');
  log.warn({ event: 'EVENT' }, 'msg');
  log.error('msg');
  log.error({ event: 'EVENT' }, 'msg');
  log.fatal('msg');
  log.fatal({ event: 'EVENT' }, 'msg');

  log.child().info('msg');
  log.child({ anything: 'value' }).trace('msg');

  const serverLogger = log.child({ cat: 'server', id: 4333 });
  serverLogger.info.begin({}, 'Starting server...');
  await serverLogger.trace.complete('something', async () => {
    // ... do something ...
  });

  serverLogger.trace.end();
}

function configTest() {
  assert<number>(session.workersCount);
  assert<string>(config.configurationName);
  assert<Record<string, Detox.DetoxAppConfig>>(config.apps);
  assert<Detox.DetoxArtifactsConfig>(config.artifacts);
  assert<Detox.DetoxBehaviorConfig>(config.behavior);
  assert<DetoxInternals.CLIConfig>(config.cli);
  assert<Detox.DetoxDeviceConfig>(config.device);
  assert<Detox.DetoxLoggerConfig>(config.logger);
  assert<Detox.DetoxSessionConfig>(config.session);
  assert<Detox.DetoxTestRunnerConfig>(config.testRunner);
}

async function lifecycleTest() {
  await onHookFailure({
    error: new Error('Hook failure'),
    hook: random<'beforeAll' | 'beforeEach' | 'afterEach' | 'afterAll'>(),
  });

  await onHookStart({
    hook: random<'beforeAll' | 'beforeEach' | 'afterEach' | 'afterAll'>(),
  });

  await onHookSuccess({
    hook: random<'beforeAll' | 'beforeEach' | 'afterEach' | 'afterAll'>(),
  });

  await onRunDescribeFinish({
    name: 'Test suite',
  });

  await onRunDescribeStart({
    name: 'Test suite',
  });

  await onRunFinish({

  });

  await onRunStart({
    title: 'Some test',
    fullName: 'Test suite > Some test',
    status: 'running',
    invocations: 0,
  });

  await onTestDone({
    title: 'Some test',
    fullName: 'Test suite > Some test',
    status: Math.random() < 0.5 ? 'failed' : 'passed',
    invocations: 1,
    timedOut: false,
  });

  await onTestFnFailure({
    error: new Error('Test fn failure'),
  });

  await onTestFnStart({

  });

  await onTestFnSuccess({

  });

  await onTestStart({

  });
}

Promise.all([
  internalsTest() ,
  lifecycleTest(),
  logTest(),
  Promise.resolve().then(configTest),
]).catch(() => {});
