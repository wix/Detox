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
  trace,
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
  serverLogger.trace.complete('something', async () => {

  });
  serverLogger.trace.end();

  const event1: Detox.LogEvent = {
    id: 1,
    msg: 'Long method',
    cat: [],
    args: {},
    cname: 'inactive'
  };

  const event2 = {
    cname: 'red',
    args: { $success: true },
  };

  const handle1 = trace.startSection('Long method', event1.args);
  if (Math.random() > 0.5) {
    handle1.end();
  } else {
    handle1.end(event2);
  }

  const handle2 = trace.startSection(event1);
  if (Math.random() > 0.5) {
    handle2.end();
  } else {
    handle2.end(event2);
  }

  await trace('Long method', async () => {
    // do something
  });

  trace(event1, () => {
    // do something
  });
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
