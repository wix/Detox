declare function random<T>(): T
declare function assert<T>(x: T): void;

import {
  config,
  globalSetup,
  globalTeardown,
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
  setup,
  teardown,
  trace,
  worker,
} from 'detox/internals';

async function internalsTest() {
  const globalOptions: DetoxInternals.DetoxGlobalSetupOptions = {
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
  };

  await resolveConfig();
  await resolveConfig({});
  await resolveConfig(globalOptions);

  await globalSetup();
  await globalSetup({});
  await globalSetup(globalOptions);

  await setup();
  await setup({});
  await setup({
    global,
    workerId: 1,
  });

  await teardown();
  await globalTeardown();
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

  const event1: Detox.TraceEvent = {
    id: 1,
    name: 'Long method',
    cat: 'user',
    args: {},
    cname: 'inactive'
  };

  const event2: Detox.TraceEvent = {
    cname: 'red',
    args: { $success: true },
  };

  const handle1 = trace.begin('Long method', event1.args);
  if (Math.random() > 0.5) {
    handle1.end();
  } else {
    handle1.end(event2);
  }

  const handle2 = trace.begin(event1);
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
  assert<Detox.DetoxDeviceConfig>(config.deviceConfig);
  assert<Detox.DetoxTestRunnerConfig>(config.runnerConfig);
  assert<Record<string, Detox.DetoxAppConfig>>(config.appsConfig);
  assert<Detox.DetoxSessionConfig>(config.sessionConfig);
  assert<Detox.DetoxArtifactsConfig>(config.artifactsConfig);
  assert<Detox.DetoxBehaviorConfig>(config.behaviorConfig);
  assert<DetoxInternals.DetoxCLIConfig>(config.cliConfig);
  assert<string>(config.configurationName);
  assert<Detox.DetoxLoggerConfig>(config.loggerConfig);
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
