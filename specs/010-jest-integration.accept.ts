/**
 * Acceptance: spec 010 — the Jest integration (the alpha-1 headline: Jest
 * test files change not at all; the jest half of interrupt handling; Jest
 * 30, a lightweight environment, invisible AbortSignal hygiene, jest's own
 * `expect` extended).
 *
 * This file is frozen and append-only.
 *
 * Style is part of the contract: tests are STRAIGHT-LINE — a fence of awaits
 * against the public dialect plus the editable helpers, no function
 * definitions in this file. The public dialect of `detox test` is
 * its argv, environment, exit code and observable side effects; the fixture
 * TEST FILES inline below are themselves contract — each is written exactly
 * as a v20 user writes an e2e file, and stays inside vocabulary the tree
 * already serves. Fixture receipts are plain JSON files the fixtures write
 * into the project directory (the spawn contract fixes the runner's cwd
 * there); assertions read them back instead of parsing reporter output, so
 * nothing here freezes what a report looks like.
 *
 * Fixture policy: REAL simulators and the real Detox 20 example app where a
 * fixture launches or asserts on UI (tests 1, 3, 6 — the parity bootstrap's
 * own binary and device pin); device-only projects everywhere else. Every
 * project's `node_modules` resolves real jest 30 and the STAGED PACK as
 * `detox` (helpers/jest-project.ts): the module paths a migrant's
 * jest.config.js names are proven against the artifact users install.
 * Servers are DEDICATED (their token exists nowhere in the ambient
 * environment), so a green run proves the credentials travelled
 * config → snapshot → environment → dial and nowhere else.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

import { connect } from 'detox/client';

import { startServer } from './helpers/server';
import { resolveDetoxFrameworkExternally } from './helpers/real-app';
import { runDetoxCli, spawnDetoxCli } from './helpers/cli';
import { isPidAlive, tokenOf } from './helpers/project';
import {
  exampleApp,
  exampleDevice,
  readReceipt,
  waitForReceipt,
  writeJestProject,
} from './helpers/jest-project';
import { waitUntil } from './helpers/simctl';

/**
 * The migrant's `e2e/jest.config.js`, verbatim v20 shape: all four
 * `detox/runners/jest/*` module paths, one worker, jest's own testTimeout as
 * the only test clock. Tests that need a different worker count spread over
 * this object — the deltas are part of each test's story.
 */
const JEST_CONFIG = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.js'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  maxWorkers: 1,
  testTimeout: 120_000,
};

/**
 * Test 1 — the headline. A v20-shaped project (aliased
 * devices/apps/configurations, the `client` block from 009) runs one test
 * file written exactly as a v20 user writes it: globals from
 * `exposeGlobals` (`device`, `element`, `by`), a `beforeAll` launch, an
 * element tap, a detox expectation THROUGH JEST'S OWN `expect` — and a
 * plain `expect(2 + 2).toBe(4)` in the same file, which v20's shadowed
 * global never allowed. Pinned: exit 0; the receipt
 * proves the file really ran against a real device; the configured token
 * appears in NO output line.
 */
void test('an unedited v20-shaped jest suite passes: globals, both expect vocabularies, exit 0', async (t) => {
  const frameworkPath = await resolveDetoxFrameworkExternally(t.signal);
  await using server = await startServer({
    dedicated: true,
    iosDetoxFrameworkPath: frameworkPath,
    signal: t.signal,
  });
  const token = tokenOf(server.address);
  const project = await writeJestProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' } },
      client: { server: server.address.url, token },
      devices: { sim: { type: 'ios.simulator', device: { type: exampleDevice() } } },
      apps: {
        example: {
          type: 'ios.app',
          name: 'example',
          bundleId: 'com.wix.detox-example',
          binaryPath: exampleApp(),
        },
      },
      configurations: { 'ios.sim.release': { device: 'sim', app: 'example' } },
    },
    'e2e/jest.config.js': JEST_CONFIG,
    'e2e/starter.test.js': `
const { writeFileSync } = require('node:fs');

describe('the migrated suite', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('drives the app and speaks both expect vocabularies', async () => {
    await element(by.text('Sanity')).tap();
    await expect(element(by.text('Welcome'))).toBeVisible();
    expect(2 + 2).toBe(4);
    writeFileSync('receipt-sanity.json', JSON.stringify({ udid: device.id }));
  });
});
`,
  });

  const result = await runDetoxCli(['test', '-c', 'ios.sim.release'], {
    cwd: project.dir,
    signal: t.signal,
  });

  assert.equal(result.exitCode, 0, `expected a green run, output:\n${result.output}`);
  const receipt = await readReceipt<{ udid: string }>(project.path('receipt-sanity.json'));
  assert.match(receipt.udid, /^[0-9A-F-]{36}$/i, 'the fixture saw a real simulator udid');
  assert.ok(!result.output.includes(token), 'the configured token appears in no output line');
});

/**
 * Test 2 — one session per worker, sessions survive file
 * boundaries. Run A (`maxWorkers: 1`, two files): both files pass and
 * record the SAME udid and worker — the second file ADOPTED the first's
 * session (were the environment re-initializing per file, compat's own
 * already-initialized refusal would have made this run red). The config
 * also carries two keys v20 consumed and alpha does not
 * (`testRunner.jest.setupTimeout` — there is no setup clock — and
 * `behavior.cleanup.shutdownDevice` — the server owns lifecycle), and the
 * run warns, naming each. Run B (`maxWorkers: 2`, two files that
 * rendezvous): both workers hold a session AT ONCE on two DISTINCT
 * devices — one session per worker, never shared. Both runs also record
 * `process.pid`: run A's files share ONE pid (the same worker process
 * adopted the session), run B's files carry TWO (the rendezvous proves
 * "at once", the pids prove "different processes").
 */
void test('maxWorkers 1 reuses one session across files; maxWorkers 2 runs two sessions at once', async (t) => {
  await using server = await startServer({ dedicated: true, maxPool: 2, signal: t.signal });
  const token = tokenOf(server.address);

  const projectA = await writeJestProject({
    '.detoxrc.js': {
      testRunner: {
        args: { $0: 'jest', config: 'e2e/jest.config.js' },
        jest: { setupTimeout: 120_000 },
      },
      behavior: { cleanup: { shutdownDevice: true } },
      client: { server: server.address.url, token },
      devices: { sim: { type: 'ios.simulator', device: { type: exampleDevice() } } },
      apps: { app: { type: 'ios.app', name: 'app', bundleId: 'com.example.fixture' } },
      configurations: { 'ios.sim': { device: 'sim', app: 'app' } },
    },
    'e2e/jest.config.js': JEST_CONFIG,
    'e2e/first.test.js': `
const { writeFileSync } = require('node:fs');

it('records which device, worker and process served the first file', () => {
  writeFileSync('receipt-first.json', JSON.stringify({
    udid: device.id,
    worker: process.env.JEST_WORKER_ID,
    pid: process.pid,
  }));
});
`,
    'e2e/second.test.js': `
const { writeFileSync } = require('node:fs');

it('records which device, worker and process served the second file', () => {
  writeFileSync('receipt-second.json', JSON.stringify({
    udid: device.id,
    worker: process.env.JEST_WORKER_ID,
    pid: process.pid,
  }));
});
`,
  });

  const runA = await runDetoxCli(['test', '-c', 'ios.sim'], {
    cwd: projectA.dir,
    signal: t.signal,
  });
  assert.equal(runA.exitCode, 0, `expected run A green, output:\n${runA.output}`);
  const firstA = await readReceipt<{ udid: string; worker: string; pid: number }>(
    projectA.path('receipt-first.json'),
  );
  const secondA = await readReceipt<{ udid: string; worker: string; pid: number }>(
    projectA.path('receipt-second.json'),
  );
  assert.equal(firstA.udid, secondA.udid, 'one worker, one session, one device across files');
  assert.equal(firstA.pid, secondA.pid, 'the SAME worker process served both files');
  assert.ok(runA.output.includes('setupTimeout'), 'the dead v20 clock key is warned by name');
  assert.ok(runA.output.includes('shutdownDevice'), 'the inert v20 behavior key is warned by name');

  const projectB = await writeJestProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' } },
      client: { server: server.address.url, token },
      devices: { sim: { type: 'ios.simulator', device: { type: exampleDevice() } } },
      apps: { app: { type: 'ios.app', name: 'app', bundleId: 'com.example.fixture' } },
      configurations: { 'ios.sim': { device: 'sim', app: 'app' } },
    },
    'e2e/jest.config.js': { ...JEST_CONFIG, maxWorkers: 2 },
    'e2e/first.test.js': `
const { writeFileSync, existsSync } = require('node:fs');

it('holds a device until the other worker holds one too', async () => {
  writeFileSync('receipt-first.json', JSON.stringify({ udid: device.id, pid: process.pid }));
  // Rendezvous: finish only after the OTHER file's receipt exists — with
  // maxWorkers 2 both workers provably hold a session at the same moment.
  while (!existsSync('receipt-second.json')) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
});
`,
    'e2e/second.test.js': `
const { writeFileSync, existsSync } = require('node:fs');

it('holds a device until the other worker holds one too', async () => {
  writeFileSync('receipt-second.json', JSON.stringify({ udid: device.id, pid: process.pid }));
  while (!existsSync('receipt-first.json')) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
});
`,
  });

  const runB = await runDetoxCli(['test', '-c', 'ios.sim'], {
    cwd: projectB.dir,
    signal: t.signal,
  });
  assert.equal(runB.exitCode, 0, `expected run B green, output:\n${runB.output}`);
  const firstB = await readReceipt<{ udid: string; pid: number }>(
    projectB.path('receipt-first.json'),
  );
  const secondB = await readReceipt<{ udid: string; pid: number }>(
    projectB.path('receipt-second.json'),
  );
  assert.notEqual(firstB.udid, secondB.udid, 'two workers, two sessions, two distinct devices');
  assert.notEqual(firstB.pid, secondB.pid, 'two DIFFERENT worker processes held them');
});

/**
 * Test 3 — invisible hang hygiene. Test A dies
 * by jest's own testTimeout in the middle of a real detox operation (a
 * launch takes seconds; its per-test timeout is 500 ms). Test B, in the
 * SAME file against the SAME session, then launches and asserts normally —
 * and passes: the environment aborted A's stray call behind the scenes, so
 * B found the session clean. Pinned: exit 1 (exactly A fails), B's receipt
 * exists, and the run ENDS — no wedged worker, no leaked pending call
 * holding the process (the assertion is that `runDetoxCli` resolves at
 * all).
 */
void test('a test that hangs dies alone: the next test in the file finds a clean session', async (t) => {
  const frameworkPath = await resolveDetoxFrameworkExternally(t.signal);
  await using server = await startServer({
    dedicated: true,
    iosDetoxFrameworkPath: frameworkPath,
    signal: t.signal,
  });
  const project = await writeJestProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' } },
      client: { server: server.address.url, token: tokenOf(server.address) },
      devices: { sim: { type: 'ios.simulator', device: { type: exampleDevice() } } },
      apps: {
        example: {
          type: 'ios.app',
          name: 'example',
          bundleId: 'com.wix.detox-example',
          binaryPath: exampleApp(),
        },
      },
      configurations: { 'ios.sim.release': { device: 'sim', app: 'example' } },
    },
    'e2e/jest.config.js': JEST_CONFIG,
    'e2e/hygiene.test.js': `
const { writeFileSync } = require('node:fs');

describe('hang hygiene', () => {
  it('times out mid-operation', async () => {
    // A real launch takes seconds; the 500 ms timeout below kills this
    // test first, leaving the launch in flight for the environment to
    // cancel.
    await device.launchApp({ newInstance: true });
  }, 500);

  it('starts clean and finishes green', async () => {
    await device.launchApp({ newInstance: true });
    await element(by.text('Sanity')).tap();
    await expect(element(by.text('Welcome'))).toBeVisible();
    writeFileSync('receipt-clean.json', JSON.stringify({ udid: device.id }));
  });
});
`,
  });

  const result = await runDetoxCli(['test', '-c', 'ios.sim.release'], {
    cwd: project.dir,
    signal: t.signal,
  });

  assert.equal(result.exitCode, 1, `expected exactly the timed-out failure, output:\n${result.output}`);
  assert.ok(
    result.output.includes('times out mid-operation'),
    'the hung test is the named failure',
  );
  assert.ok(
    existsSync(project.path('receipt-clean.json')),
    'the next test ran and passed against a clean session',
  );
});

/**
 * Test 4 — Ctrl+C tears down the whole tree (spec 009's test 6 pinned the
 * CLI half with a probe, this pins it through real jest). A fixture test
 * parks forever holding the
 * server's ONLY pool slot. One SIGINT to `detox test`: the CLI, jest and
 * the worker all die (pid-checked), the snapshot is deleted, and the
 * standing server SURVIVES with the device reclaimed — proven by
 * allocating it again from this process, against a one-slot pool, and
 * getting the very same simulator back.
 */
void test('one Ctrl+C kills CLI, jest and worker; the server survives and the device is reclaimed', async (t) => {
  await using server = await startServer({ dedicated: true, maxPool: 1, signal: t.signal });
  const project = await writeJestProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' } },
      client: { server: server.address.url, token: tokenOf(server.address) },
      devices: { sim: { type: 'ios.simulator', device: { type: exampleDevice() } } },
      apps: { app: { type: 'ios.app', name: 'app', bundleId: 'com.example.fixture' } },
      configurations: { 'ios.sim': { device: 'sim', app: 'app' } },
    },
    'e2e/jest.config.js': { ...JEST_CONFIG, testTimeout: 600_000 },
    'e2e/parked.test.js': `
const { writeFileSync } = require('node:fs');

it('parks forever holding the only device', async () => {
  writeFileSync('receipt-parked.json', JSON.stringify({
    workerPid: process.pid,
    udid: device.id,
    snapshotPath: process.env.DETOX_CONFIG_SNAPSHOT_PATH,
  }));
  await new Promise(() => {});
});
`,
  });

  const cli = spawnDetoxCli(['test', '-c', 'ios.sim'], { cwd: project.dir, signal: t.signal });
  const parked = await waitForReceipt<{ workerPid: number; udid: string; snapshotPath: string }>(
    project.path('receipt-parked.json'),
    { signal: t.signal },
  );

  cli.interrupt();
  const result = await cli.wait();

  assert.notEqual(result.exitCode, 0, 'an interrupted run does not exit 0');
  await waitUntil(() => !isPidAlive(parked.workerPid), {
    signal: t.signal,
    description: 'the jest worker process is gone',
  });
  assert.ok(!existsSync(parked.snapshotPath), 'the snapshot is deleted on the interrupt path');

  const session = await connect({ server: server.address, signal: t.signal });
  const device = await session.allocateDevice({
    type: 'ios.simulator',
    device: { model: exampleDevice() },
    signal: t.signal,
  });
  assert.equal(device.info.udid, parked.udid, 'the one-slot pool handed back the reclaimed simulator');
  await session.disconnect();
});

/**
 * Test 5 — `behavior.init.exposeGlobals: false` (the one consumed
 * behavior key). No detox globals exist in the file; `require('detox')` is
 * the door, and it drives the same live session (a device-level call
 * succeeds and the receipt carries the udid). jest's own `expect` global is
 * untouched by the setting — it is jest's, not ours.
 */
void test('exposeGlobals false: no detox globals, require("detox") drives the session', async (t) => {
  await using server = await startServer({ dedicated: true, signal: t.signal });
  const project = await writeJestProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' } },
      behavior: { init: { exposeGlobals: false } },
      client: { server: server.address.url, token: tokenOf(server.address) },
      devices: { sim: { type: 'ios.simulator', device: { type: exampleDevice() } } },
      apps: { app: { type: 'ios.app', name: 'app', bundleId: 'com.example.fixture' } },
      configurations: { 'ios.sim': { device: 'sim', app: 'app' } },
    },
    'e2e/jest.config.js': JEST_CONFIG,
    'e2e/noglobals.test.js': `
const { writeFileSync } = require('node:fs');

it('has no detox globals; require("detox") is the door', async () => {
  expect(typeof device).toBe('undefined');
  expect(typeof element).toBe('undefined');
  expect(typeof waitFor).toBe('undefined');
  const detox = require('detox');
  await detox.device.sendToHome();
  writeFileSync('receipt-noglobals.json', JSON.stringify({ udid: detox.device.id }));
});
`,
  });

  const result = await runDetoxCli(['test', '-c', 'ios.sim'], {
    cwd: project.dir,
    signal: t.signal,
  });

  assert.equal(result.exitCode, 0, `expected a green run, output:\n${result.output}`);
  const receipt = await readReceipt<{ udid: string }>(project.path('receipt-noglobals.json'));
  assert.match(receipt.udid, /^[0-9A-F-]{36}$/i, 'the ungoverned door drove the same live session');
});

/**
 * Test 6 — failures carry the error taxonomy, and the runner path keeps
 * the redaction obligation. A detox expectation that is WRONG fails its
 * test; jest's report names the failing test and carries a typed Detox code
 * name; the configured token appears in NO line of the whole run's output —
 * refusal and failure paths included (009's obligation extended to the
 * runner).
 */
void test('a wrong detox expectation fails through jest with a typed code, and the token leaks nowhere', async (t) => {
  const frameworkPath = await resolveDetoxFrameworkExternally(t.signal);
  await using server = await startServer({
    dedicated: true,
    iosDetoxFrameworkPath: frameworkPath,
    signal: t.signal,
  });
  const token = tokenOf(server.address);
  const project = await writeJestProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' } },
      client: { server: server.address.url, token },
      devices: { sim: { type: 'ios.simulator', device: { type: exampleDevice() } } },
      apps: {
        example: {
          type: 'ios.app',
          name: 'example',
          bundleId: 'com.wix.detox-example',
          binaryPath: exampleApp(),
        },
      },
      configurations: { 'ios.sim.release': { device: 'sim', app: 'example' } },
    },
    'e2e/jest.config.js': JEST_CONFIG,
    'e2e/wrong.test.js': `
describe('a wrong expectation', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('fails with the typed detox error in the report', async () => {
    await element(by.text('Sanity')).tap();
    await expect(element(by.text('Welcome'))).toHaveText('Goodbye');
  });
});
`,
  });

  const result = await runDetoxCli(['test', '-c', 'ios.sim.release'], {
    cwd: project.dir,
    signal: t.signal,
  });

  assert.equal(result.exitCode, 1, `expected the one failure, output:\n${result.output}`);
  assert.ok(
    result.output.includes('fails with the typed detox error in the report'),
    'jest names the failing test',
  );
  assert.match(result.output, /DETOX_[A-Z_]+/, 'the failure carries a typed Detox code name');
  assert.ok(!result.output.includes(token), 'the configured token appears in no output line');
});

/**
 * Test 7 — a dead server fails typed and fast, THROUGH jest. The
 * config dials a closed port; the environment surfaces the frozen 004
 * refusal as the file's failure (jest completes its own reporting — the
 * fixture file is named in the output), the code and the address are both
 * spoken, and the run exits non-zero. No simulator, no server, no hang.
 */
void test('a dead server is a fast typed failure through jest, naming the code and the address', async (t) => {
  const project = await writeJestProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' } },
      client: { server: 'ws://127.0.0.1:9' },
      devices: { sim: { type: 'ios.simulator', device: { type: exampleDevice() } } },
      apps: { app: { type: 'ios.app', name: 'app', bundleId: 'com.example.fixture' } },
      configurations: { 'ios.sim': { device: 'sim', app: 'app' } },
    },
    'e2e/jest.config.js': JEST_CONFIG,
    'e2e/never-runs.test.js': `
it('never runs — the environment fails the file first', () => {});
`,
  });

  const result = await runDetoxCli(['test', '-c', 'ios.sim'], {
    cwd: project.dir,
    signal: t.signal,
  });

  assert.notEqual(result.exitCode, 0, 'a run that reached no server is not green');
  assert.ok(result.output.includes('DETOX_SERVER_UNREACHABLE'), 'the refusal is the typed 004 code');
  assert.ok(result.output.includes('ws://127.0.0.1:9'), 'the refusal names the address it dialed');
  assert.ok(result.output.includes('never-runs.test.js'), 'the failure surfaced through jest itself');
});
