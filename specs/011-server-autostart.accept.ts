/**
 * Acceptance: spec 011 - detached local server autostart.
 *
 * This file is frozen and append-only.
 *
 * Style is part of the contract: straight-line awaits against
 * the public command dialect plus editable helpers, no function definitions
 * in this file. No simulator is touched. The subject is the seam between a
 * migrating project's config and the detached per-user server helper.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

import { DetoxErrorCode } from 'detox/internals';

import { runDetoxCli, spawnDetoxCli, startDetoxServerVerb } from './helpers/cli';
import {
  assertLocalHelperCookieIsPrivate,
  assertNoLocalHelperCookie,
  createLocalHelperSandbox,
  DEFAULT_LOCAL_SERVER_URL,
  readLocalHelperCookie,
  startIncompatibleLocalHelper,
  writeDeadLocalHelperCookie,
} from './helpers/local-autostart';
import {
  isPidAlive,
  probeCommand,
  readProbeReceipt,
  waitForProbeReceipt,
  writeProject,
} from './helpers/project';
import { waitUntil } from './helpers/simctl';

/**
 * Test 1 - the post-alpha migration headline. With no `client.server`
 * and no `client.autostart: false`, `detox test` attaches to a detached
 * per-user local helper or spawns it. The runner snapshot names the helper's
 * actual ephemeral URL, not the alpha default port; no helper token leaks into
 * the snapshot; the helper cookie is 0600; and a second run reuses the same
 * helper.
 */
void test('a serverless migrated project gets a detached local helper and reuses it', async (t) => {
  await using helper = await createLocalHelperSandbox();
  const project = await writeProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: probeCommand(), receipt: 'first.json' } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });

  const first = await runDetoxCli(['test', '-c', 'only'], {
    cwd: project.dir,
    env: helper.env(),
    signal: t.signal,
  });
  assert.equal(first.exitCode, 0, `expected helper-backed run to pass, stderr:\n${first.stderr}`);
  const firstReceipt = await readProbeReceipt(project.path('first.json'));
  assert.equal(firstReceipt.initOk, true, 'the runner dialed the helper from the snapshot');
  assert.match(firstReceipt.snapshot.client.server, /^ws:\/\/127\.0\.0\.1:\d+$/);
  assert.notEqual(
    firstReceipt.snapshot.client.server,
    DEFAULT_LOCAL_SERVER_URL,
    'the helper uses an ephemeral port, not the alpha explicit-server default',
  );
  assert.ok(
    !('token' in firstReceipt.snapshot.client),
    'the helper cookie may carry a token, but the runner snapshot does not',
  );
  assert.ok(!existsSync(firstReceipt.snapshotPath), 'the snapshot is still deleted post-run');

  const firstCookie = await readLocalHelperCookie(helper);
  assert.equal(firstCookie.url, firstReceipt.snapshot.client.server);
  assert.ok(isPidAlive(firstCookie.pid), 'the detached helper survives the run');
  await assertLocalHelperCookieIsPrivate(helper);

  const secondProject = await writeProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: probeCommand(), receipt: 'second.json' } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });
  const second = await runDetoxCli(['test'], {
    cwd: secondProject.dir,
    env: helper.env(),
    signal: t.signal,
  });
  assert.equal(second.exitCode, 0, `expected attach-backed run to pass, stderr:\n${second.stderr}`);
  const secondReceipt = await readProbeReceipt(secondProject.path('second.json'));
  assert.equal(
    secondReceipt.snapshot.client.server,
    firstReceipt.snapshot.client.server,
    'the second run attaches to the already-spawned helper',
  );
});

/**
 * Test 2 - the forever opt-out. `client.autostart: false` preserves
 * the alpha behavior: no helper probe, no helper spawn, the snapshot names
 * the default explicit `detox server` address, and no helper cookie appears.
 */
void test('client.autostart false keeps the explicit-server path and creates no helper', async (t) => {
  await using helper = await createLocalHelperSandbox();
  const project = await writeProject({
    '.detoxrc.js': {
      client: { autostart: false },
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });

  const result = await runDetoxCli(['test', '--exit', '5'], {
    cwd: project.dir,
    env: helper.env(),
    signal: t.signal,
  });
  assert.equal(result.exitCode, 5, 'the probe exit code propagates; no server outcome involved');
  const receipt = await readProbeReceipt(project.path('receipt.json'));
  assert.equal(receipt.snapshot.client.server, DEFAULT_LOCAL_SERVER_URL);
  assert.equal(receipt.initOk, false, 'nothing was spawned to save the default-port dial');
  assert.equal(receipt.initErrorCode, DetoxErrorCode.DETOX_SERVER_UNREACHABLE);
  assertNoLocalHelperCookie(helper);
});

/**
 * Test 3 - an explicit server is stronger than the helper. A config
 * that names `client.server` never consults the helper state, never creates a
 * cookie, and the runner dials exactly the URL the project named.
 */
void test('an explicit client.server bypasses the helper', async (t) => {
  await using helper = await createLocalHelperSandbox();
  await using server = await startDetoxServerVerb({ signal: t.signal });
  const project = await writeProject({
    '.detoxrc.js': {
      client: { server: server.url },
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });

  const result = await runDetoxCli(['test'], {
    cwd: project.dir,
    env: helper.env(),
    signal: t.signal,
  });
  assert.equal(result.exitCode, 0, `expected explicit-server run to pass, stderr:\n${result.stderr}`);
  const receipt = await readProbeReceipt(project.path('receipt.json'));
  assert.equal(receipt.initOk, true);
  assert.equal(receipt.snapshot.client.server, server.url);
  assertNoLocalHelperCookie(helper);
});

/**
 * Test 4 - stale cookies are not state. A cookie pointing at a dead
 * process/dead port is ignored under the singleton lock; the CLI spawns a new
 * helper and overwrites the cookie with the live helper's URL.
 */
void test('a dead helper cookie is replaced by a live helper', async (t) => {
  await using helper = await createLocalHelperSandbox();
  const dead = await writeDeadLocalHelperCookie(helper);
  const project = await writeProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });

  const result = await runDetoxCli(['test'], { cwd: project.dir, env: helper.env(), signal: t.signal });
  assert.equal(result.exitCode, 0, `expected stale-cookie recovery to pass, stderr:\n${result.stderr}`);
  const receipt = await readProbeReceipt(project.path('receipt.json'));
  assert.notEqual(receipt.snapshot.client.server, dead.url);
  const cookie = await readLocalHelperCookie(helper);
  assert.equal(cookie.url, receipt.snapshot.client.server);
});

/**
 * Test 5 - the singleton is real under a race. Two `detox test`
 * processes starting at the same time under the same helper root converge on
 * one helper URL; neither gets a private throwaway server.
 */
void test('concurrent serverless runs converge on one detached helper', async (t) => {
  await using helper = await createLocalHelperSandbox();
  const firstProject = await writeProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: probeCommand(), receipt: 'first.json', park: true } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });
  const secondProject = await writeProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: probeCommand(), receipt: 'second.json', park: true } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });

  const first = spawnDetoxCli(['test'], { cwd: firstProject.dir, env: helper.env(), signal: t.signal });
  const second = spawnDetoxCli(['test'], { cwd: secondProject.dir, env: helper.env(), signal: t.signal });
  const firstReceipt = await waitForProbeReceipt(firstProject.path('first.json'), { signal: t.signal });
  const secondReceipt = await waitForProbeReceipt(secondProject.path('second.json'), { signal: t.signal });
  assert.equal(firstReceipt.initOk, true);
  assert.equal(secondReceipt.initOk, true);
  assert.equal(
    secondReceipt.snapshot.client.server,
    firstReceipt.snapshot.client.server,
    'both racers attached to the same helper URL',
  );

  first.interrupt();
  second.interrupt();
  assert.notEqual((await first.wait()).exitCode, 0);
  assert.notEqual((await second.wait()).exitCode, 0);
  const cookie = await readLocalHelperCookie(helper);
  assert.equal(cookie.url, firstReceipt.snapshot.client.server);
  assert.ok(isPidAlive(cookie.pid), 'the helper outlives both interrupted runs');
});

/**
 * Test 6 - retire-on-newer is bounded by ownership and idleness. A
 * helper that speaks the wrong protocol but reports an active session is not
 * killed under the user's feet; the run fails typed and names the live holder.
 */
void test('a busy incompatible helper is refused, not replaced', async (t) => {
  await using helper = await createLocalHelperSandbox();
  await using incompatible = await startIncompatibleLocalHelper(helper, { activeSessions: 1 });
  const project = await writeProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });

  const result = await runDetoxCli(['test'], { cwd: project.dir, env: helper.env(), signal: t.signal });
  assert.notEqual(result.exitCode, 0, 'a busy incompatible helper cannot be replaced');
  assert.match(result.output, /protocol|version/i);
  assert.match(result.output, /busy|active|in use/i);
  assert.ok(isPidAlive(incompatible.pid), 'the busy older helper was left running');
  assert.ok(!existsSync(project.path('receipt.json')), 'the runner never spawned');
});

/**
 * Test 7 - the same incompatible helper may be retired when it is
 * idle and helper-owned. The user sees a successful run on a new helper URL.
 */
void test('an idle incompatible helper is retired and replaced', async (t) => {
  await using helper = await createLocalHelperSandbox();
  await using incompatible = await startIncompatibleLocalHelper(helper, { activeSessions: 0 });
  const project = await writeProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });

  const result = await runDetoxCli(['test'], { cwd: project.dir, env: helper.env(), signal: t.signal });
  assert.equal(result.exitCode, 0, `expected idle helper replacement to pass, stderr:\n${result.stderr}`);
  await waitUntil(() => !isPidAlive(incompatible.pid), {
    signal: t.signal,
    description: 'the idle incompatible helper to be retired',
  });
  const receipt = await readProbeReceipt(project.path('receipt.json'));
  assert.notEqual(receipt.snapshot.client.server, incompatible.url);
  assert.equal((await readLocalHelperCookie(helper)).url, receipt.snapshot.client.server);
});

/**
 * Test 8 - the one manual escape hatch. `detox server --restart`
 * forcibly replaces only the helper-owned local server, even when it has an
 * active session; it rewrites the cookie and exits after the new helper is
 * ready. The next serverless `detox test` uses the new helper URL.
 */
void test('detox server --restart replaces the helper-owned local server', async (t) => {
  await using helper = await createLocalHelperSandbox();
  const seedProject = await writeProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: probeCommand(), receipt: 'seed.json' } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });
  const seeded = await runDetoxCli(['test'], { cwd: seedProject.dir, env: helper.env(), signal: t.signal });
  assert.equal(seeded.exitCode, 0, `expected seed run to pass, stderr:\n${seeded.stderr}`);
  const oldCookie = await readLocalHelperCookie(helper);

  const busyProject = await writeProject({
    '.detoxrc.js': {
      testRunner: {
        args: { $0: probeCommand(), receipt: 'busy.json', park: true, holdSession: true },
      },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });
  const busy = spawnDetoxCli(['test'], {
    cwd: busyProject.dir,
    env: helper.env(),
    signal: t.signal,
  });
  const busyReceipt = await waitForProbeReceipt(busyProject.path('busy.json'), { signal: t.signal });
  assert.equal(busyReceipt.initOk, true, 'the parked runner holds a live helper session');
  assert.equal(busyReceipt.snapshot.client.server, oldCookie.url);

  const restarted = await runDetoxCli(['server', '--restart'], {
    cwd: busyProject.dir,
    env: helper.env(),
    signal: t.signal,
  });
  assert.equal(restarted.exitCode, 0, `expected helper restart to pass, stderr:\n${restarted.stderr}`);
  assert.match(
    restarted.output,
    /active|holder|session/i,
    'the destructive restart narrates that it replaced a helper with live sessions',
  );
  await waitUntil(() => !isPidAlive(oldCookie.pid), {
    signal: t.signal,
    description: 'the old helper pid to die after restart',
  });
  const newCookie = await readLocalHelperCookie(helper);
  assert.notEqual(newCookie.url, oldCookie.url, 'restart rewrites the helper URL');
  assert.notEqual(newCookie.pid, oldCookie.pid, 'restart replaces the helper process');
  assert.ok(isPidAlive(newCookie.pid), 'the restarted helper is alive');

  const nextProject = await writeProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: probeCommand(), receipt: 'next.json' } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });
  const next = await runDetoxCli(['test'], { cwd: nextProject.dir, env: helper.env(), signal: t.signal });
  assert.equal(next.exitCode, 0, `expected post-restart run to pass, stderr:\n${next.stderr}`);
  const nextReceipt = await readProbeReceipt(nextProject.path('next.json'));
  assert.equal(nextReceipt.snapshot.client.server, newCookie.url);

  busy.interrupt();
  assert.notEqual((await busy.wait()).exitCode, 0);
});

/**
 * Test 9 - `--restart` stays helper maintenance, never an
 * operator-server shape. Explicit serving flags are refused, while config/env
 * serving defaults are ignored.
 */
void test('detox server --restart stays helper mode around serving flags and defaults', async (t) => {
  await using helper = await createLocalHelperSandbox();
  const flagsProject = await writeProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });

  const refused = await runDetoxCli(['server', '--restart', '--port', '0'], {
    cwd: flagsProject.dir,
    env: helper.env(),
    signal: t.signal,
  });
  assert.notEqual(refused.exitCode, 0, 'restart plus a serving-shape flag is a usage refusal');
  assert.match(refused.output, /--restart/);
  assert.match(refused.output, /--port/);
  assertNoLocalHelperCookie(helper);
  assert.ok(!existsSync(flagsProject.path('receipt.json')), 'no runner or helper side effect happened');

  const defaultsProject = await writeProject({
    '.detoxrc.js': {
      server: { host: '0.0.0.0', port: 9, maxPool: 1 },
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });

  const result = await runDetoxCli(['server', '--restart'], {
    cwd: defaultsProject.dir,
    env: {
      ...helper.env(),
      PORT: '9',
      DETOX_SERVER_HOST: '0.0.0.0',
      DETOX_REMOTE_MAX_POOL: '1',
    },
    signal: t.signal,
  });
  assert.equal(result.exitCode, 0, `expected restart to ignore serving defaults, stderr:\n${result.stderr}`);
  const cookie = await readLocalHelperCookie(helper);
  assert.match(cookie.url, /^ws:\/\/127\.0\.0\.1:\d+$/);
  assert.ok(!cookie.url.endsWith(':9'), 'restart did not apply the project/env server port');
  assert.ok(isPidAlive(cookie.pid), 'the helper started despite hostile serving defaults');
});
