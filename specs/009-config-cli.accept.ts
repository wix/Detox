/**
 * Acceptance: spec 009 — configuration and the `detox` command line (the
 * alpha-1 target and the three-Mini farm).
 *
 * This file is frozen and append-only. There is no run-scoped autostart; tests
 * 3 and 6 pin only observables that survive the post-alpha attach-or-spawn
 * helper, keyed on the explicit `server.autostart: false` spelling.
 *
 * Style is part of the contract: tests are STRAIGHT-LINE — a fence of awaits
 * against the public dialect plus the editable helpers, no function
 * definitions in this file. The public dialect of a COMMAND is its
 * argv, environment, exit code and observable side effects, so these tests
 * spawn the REAL built CLI in freshly written temp projects and read what
 * comes back; `connect` from `detox/client` is used only as an instrument to
 * prove reachability (frozen 004 behavior: it dials eagerly and rejects
 * typed). No typed door is needed — this spec adds no client-API surface.
 *
 * Fixture policy (binding on this file): NO simulator is ever
 * touched — the subject is the seam between a project's config file and the
 * wire. The configured test runner in every project is the probe script
 * (`helpers/probe-runner.cjs`, editable): it consumes the runner-side
 * contract exactly where spec 010's jest integration will (the
 * DETOX_CONFIG_SNAPSHOT_PATH file), dials the snapshot's `client.server` —
 * with a bearer header only when the snapshot carries a token, since auth is
 * opt-in and OFF by default — and writes a receipt these
 * assertions read. Receipt paths in configs are RELATIVE because the spawn
 * contract fixes the runner's cwd to the CLI's own. Test 1 deliberately runs
 * against a DEDICATED server AND asserts its token exists nowhere in the
 * ambient environment, so a successful dial proves the credentials came from
 * the config file and nowhere else.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { connect, DetoxErrorCode } from 'detox/client';

import { startServer } from './helpers/server';
import { assertDetoxError, rejectionOf } from './helpers/errors';
import {
  runDetoxCli,
  spawnDetoxCli,
  startDetoxRelayVerb,
  startDetoxServerVerb,
} from './helpers/cli';
import {
  bearerAddress,
  isPidAlive,
  probeCommand,
  readProbeReceipt,
  tokenOf,
  waitForProbeReceipt,
  writeProject,
} from './helpers/project';
import { waitUntil } from './helpers/simctl';

/**
 * Test 1 — the upgrade story. A v20-shaped `.detoxrc.js` — apps and
 * devices maps with BOTH platforms, aliased configurations — plus the NEW
 * `client` block (the one edit a migrating project makes) drives
 * `detox test -c ios.sim.release` against a remote Detox Server named by
 * `client.server` + `client.token`. Pinned: the runner receives the
 * resolved snapshot (configuration name, server url, token, the app with its
 * bundleId and cwd-absolute binaryPath, the device query mapped v20→v21:
 * type→model, os→os) and DETOX_CONFIGURATION set to the winner; the
 * dial with the config's credentials succeeds against a server whose token
 * the ambient environment does not hold; unknown config keys (`artifacts`)
 * pass through verbatim; the android configuration coexists untouched; the
 * token appears NOWHERE in the CLI's output; and the snapshot file is
 * DELETED once the run ends (it may carry a credential).
 */
test('an upgraded v20-shaped config drives a run against a remote server', async (t) => {
  await using server = await startServer({ dedicated: true, signal: t.signal });
  const token = tokenOf(server.address);
  assert.ok(
    !(process.env.DETOX_SERVER_TOKEN ?? '').includes(token),
    'precondition: the ambient environment does not hold the dedicated token — the config is the only source',
  );
  const project = await writeProject({
    '.detoxrc.js': {
      client: { server: server.url, token },
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
      artifacts: { plugins: { log: 'all' } },
      apps: {
        'ios.release': {
          type: 'ios.app',
          name: 'example',
          binaryPath: 'ios/build/Release-iphonesimulator/example.app',
          bundleId: 'com.wix.detox-example',
        },
        'android.release': {
          type: 'android.apk',
          name: 'example',
          binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
        },
      },
      devices: {
        simulator: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro', os: '26.1' } },
        emulator: { type: 'android.emulator', device: { avdName: 'Pixel_3a_API_36' } },
      },
      configurations: {
        'ios.sim.release': { device: 'simulator', app: 'ios.release' },
        'android.emu.release': { device: 'emulator', app: 'android.release' },
      },
    },
  });

  const result = await runDetoxCli(['test', '-c', 'ios.sim.release'], {
    cwd: project.dir,
    signal: t.signal,
  });
  assert.equal(result.exitCode, 0, `expected a green run, stderr:\n${result.stderr}`);
  assert.ok(
    !result.output.includes(token),
    'a configured bearer token appears nowhere in the CLI output',
  );

  const receipt = await readProbeReceipt(project.path('receipt.json'));
  assert.equal(receipt.snapshot.configurationName, 'ios.sim.release');
  assert.equal(receipt.snapshot.client.server, server.url, 'the config named the server the runner got');
  assert.equal(receipt.snapshot.client.token, token, 'the config named the token the runner got');
  assert.equal(
    receipt.configurationEnv,
    'ios.sim.release',
    'DETOX_CONFIGURATION reaches the runner as the resolved winner',
  );
  assert.equal(receipt.initOk, true, "the runner dialed the config's server with the config's token");
  assert.deepEqual(
    receipt.snapshot.apps,
    [
      {
        name: 'example',
        bundleId: 'com.wix.detox-example',
        binaryPath: path.resolve(project.dir, 'ios/build/Release-iphonesimulator/example.app'),
        type: 'ios.app',
      },
    ],
    'the selected ios app, alone, with its binaryPath resolved absolute against the CLI cwd',
  );
  assert.deepEqual(
    receipt.snapshot.device,
    { type: 'ios.simulator', query: { model: 'iPhone 17 Pro', os: '26.1' } },
    'the v20 device matcher maps onto the v21 query: type→model, os→os',
  );
  assert.deepEqual(
    receipt.snapshot.artifacts,
    { plugins: { log: 'all' } },
    'keys this spec does not consume pass through the snapshot verbatim for their heir specs',
  );
  assert.ok(
    !existsSync(receipt.snapshotPath),
    'the snapshot is an object on disk with a lifetime — deleted when the run ends',
  );
});

/**
 * Test 2 — discovery and selection speak plainly. A `package.json`
 * `detox` key is a discovered config; with two configurations and no
 * selection the refusal NAMES both; an unknown name is named back; the
 * DETOX_CONFIGURATION environment variable selects (and is what the runner
 * inherits); and a `detox.config.js` project with exactly ONE configuration
 * runs with no `-c` at all (the single-configuration default). Refusals
 * happen BEFORE any runner spawns — no receipt exists after them.
 */
test('discovery finds the config; selection refuses ambiguity by name and defaults when unambiguous', async (t) => {
  await using server = await startServer({ dedicated: true, signal: t.signal });
  const token = tokenOf(server.address);

  const twoConfigs = await writeProject({
    'package.json': {
      name: 'spec009-two-configs',
      version: '1.0.0',
      detox: {
        client: { server: server.url, token },
        testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
        apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
        devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
        configurations: {
          first: { device: 'sim', app: 'app' },
          second: { device: 'sim', app: 'app' },
        },
      },
    },
  });

  const ambiguous = await runDetoxCli(['test'], { cwd: twoConfigs.dir, signal: t.signal });
  assert.notEqual(ambiguous.exitCode, 0, 'two configurations and no selection cannot run');
  assert.ok(
    ambiguous.stderr.includes('first') && ambiguous.stderr.includes('second'),
    `the refusal names every configuration so the user can pick, got:\n${ambiguous.stderr}`,
  );
  assert.ok(
    !existsSync(twoConfigs.path('receipt.json')),
    'a config refusal never spawns the runner',
  );

  const unknown = await runDetoxCli(['test', '-c', 'third'], {
    cwd: twoConfigs.dir,
    signal: t.signal,
  });
  assert.notEqual(unknown.exitCode, 0);
  assert.ok(
    unknown.stderr.includes('third'),
    `an unknown configuration is named back, got:\n${unknown.stderr}`,
  );

  const viaEnv = await runDetoxCli(['test'], {
    cwd: twoConfigs.dir,
    env: { DETOX_CONFIGURATION: 'second' },
    signal: t.signal,
  });
  assert.equal(viaEnv.exitCode, 0, `expected the env-selected run to pass, stderr:\n${viaEnv.stderr}`);
  const envReceipt = await readProbeReceipt(twoConfigs.path('receipt.json'));
  assert.equal(envReceipt.snapshot.configurationName, 'second');
  assert.equal(envReceipt.configurationEnv, 'second');
  assert.equal(envReceipt.initOk, true);

  const oneConfig = await writeProject({
    'detox.config.js': {
      client: { server: server.url, token },
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });
  const defaulted = await runDetoxCli(['test'], { cwd: oneConfig.dir, signal: t.signal });
  assert.equal(
    defaulted.exitCode,
    0,
    `a single configuration needs no -c at all, stderr:\n${defaulted.stderr}`,
  );
  const defaultedReceipt = await readProbeReceipt(oneConfig.path('receipt.json'));
  assert.equal(defaultedReceipt.snapshot.configurationName, 'only');
  assert.equal(defaultedReceipt.initOk, true);
});

/**
 * Test 3 — with autostart OFF, `detox test` starts no server. Both halves
 * carry the EXPLICIT never-spawn spelling `server: { autostart: false }`.
 * Spec 011 gave a config-LESS run a user-scoped local helper (attach-first,
 * ephemeral port), so "no `client` block at all" stopped meaning "nothing is
 * spawned"; that path is 011's to pin, and this suite keeps the CLI/config
 * half. With autostart off and no address, the snapshot points the runner at
 * the DEFAULT local address (the `detox server` verb's own bind) and the CLI
 * says in one line what it expects there; the probe's `--exit 5` makes the
 * run's outcome independent of whatever may or may not listen on that
 * well-known port on this machine. With a dead explicit address it fails
 * typed and fast: nothing is spawned to save the run (v20's autoStart would
 * have). No `server.auth` anywhere → the snapshot carries NO token — auth
 * stays opt-in and OFF.
 */
test('detox test with autostart off never starts a server: the default address is named, a dead address fails typed', async (t) => {
  const serverless = await writeProject({
    '.detoxrc.js': {
      server: { autostart: false },
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });

  const named = await runDetoxCli(['test', '--exit', '5'], {
    cwd: serverless.dir,
    signal: t.signal,
  });
  assert.equal(named.exitCode, 5, 'the probe said 5, so detox test says 5 — no server outcome involved');
  assert.ok(
    named.stdout.includes('ws://127.0.0.1:8080') && named.stdout.includes('detox server'),
    `a serverless run says what it expects and where, got:\n${named.stdout}`,
  );
  const namedReceipt = await readProbeReceipt(serverless.path('receipt.json'));
  assert.equal(
    namedReceipt.snapshot.client.server,
    'ws://127.0.0.1:8080',
    'the snapshot names the default local address — the standing `detox server` bind',
  );
  assert.ok(
    !('token' in namedReceipt.snapshot.client),
    'no auth was configured, so no token exists anywhere — opt-in and OFF',
  );
  assert.ok(
    !existsSync(namedReceipt.snapshotPath),
    'the snapshot is deleted when the run ends, on this path too',
  );

  const deadAddress = await writeProject({
    '.detoxrc.js': {
      client: { server: 'ws://127.0.0.1:9' },
      server: { autostart: false },
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });
  const refused = await runDetoxCli(['test'], { cwd: deadAddress.dir, signal: t.signal });
  assert.notEqual(refused.exitCode, 0, 'a dead server address cannot be a green run');
  const refusedReceipt = await readProbeReceipt(deadAddress.path('receipt.json'));
  assert.equal(refusedReceipt.initOk, false, 'nothing was spawned to save the run — the dial failed');
  assert.equal(
    refusedReceipt.initErrorCode,
    DetoxErrorCode.DETOX_SERVER_UNREACHABLE,
    'the failure is the frozen typed unreachable, fast — not a hang, not a spawn',
  );
});

/**
 * Test 4 — iOS-only is a spoken refusal, not a silent skip, and its
 * check order is pinned DEVICE FIRST, THEN APP (spec 009): the first fixture
 * violates both at once and must name the device type. A configured token
 * appears in no refusal output either — redaction is not a happy-path-only
 * promise. Neither refusal ever spawns the runner.
 */
test('selecting a non-iOS configuration is a typed refusal naming the alpha scope, device first', async (t) => {
  const secret = 'spec009-refusal-path-secret-8c1d40aa72';
  const project = await writeProject({
    '.detoxrc.js': {
      client: { server: 'ws://127.0.0.1:9', token: secret },
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
      apps: {
        iosApp: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' },
        androidApp: { type: 'android.apk', name: 'example', binaryPath: 'app.apk' },
      },
      devices: {
        sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } },
        emu: { type: 'android.emulator', device: { avdName: 'Pixel_3a_API_36' } },
      },
      configurations: {
        'android.emu.release': { device: 'emu', app: 'androidApp' },
        'ios.wrong.app': { device: 'sim', app: 'androidApp' },
      },
    },
  });

  const androidDevice = await runDetoxCli(['test', '-c', 'android.emu.release'], {
    cwd: project.dir,
    signal: t.signal,
  });
  assert.notEqual(androidDevice.exitCode, 0);
  assert.ok(
    androidDevice.stderr.includes('android.emulator'),
    `both halves offend, and the pinned order names the DEVICE type first, got:\n${androidDevice.stderr}`,
  );

  const androidApp = await runDetoxCli(['test', '-c', 'ios.wrong.app'], {
    cwd: project.dir,
    signal: t.signal,
  });
  assert.notEqual(androidApp.exitCode, 0);
  assert.ok(
    androidApp.stderr.includes('android.apk'),
    `the device passes, so the refusal names the app type, got:\n${androidApp.stderr}`,
  );

  assert.ok(
    !androidDevice.output.includes(secret) && !androidApp.output.includes(secret),
    'the configured token appears in no refusal output — redaction covers every path',
  );
  assert.ok(
    !existsSync(project.path('receipt.json')),
    'neither refusal ever spawned the runner',
  );
});

/**
 * Test 5 — the runner owns its own argv. The CLI consumes its two
 * flags and forwards EVERYTHING else verbatim, in the user's order, after
 * the configured args (object flags render as `--key value` token pairs);
 * and the runner's exit code propagates VERBATIM — an improvement over
 * v20's flattening to 1, because CI matrices key on exit codes. The probe
 * exits 7 only after its receipt and its dial, so one run pins forwarding,
 * snapshot delivery and propagation together.
 */
test('unrecognized args forward to the runner verbatim, and its exit code comes back untouched', async (t) => {
  await using server = await startServer({ dedicated: true, signal: t.signal });
  const project = await writeProject({
    '.detoxrc.js': {
      client: { server: server.url, token: tokenOf(server.address) },
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });

  const result = await runDetoxCli(
    ['test', '-c', 'only', '--exit', '7', 'e2e/some.spec.js'],
    { cwd: project.dir, signal: t.signal },
  );
  assert.equal(result.exitCode, 7, 'the runner said 7, so detox test says 7');

  const receipt = await readProbeReceipt(project.path('receipt.json'));
  assert.equal(receipt.initOk, true, 'the probe dialed before exiting on purpose');
  assert.deepEqual(
    receipt.argv,
    ['--receipt', 'receipt.json', '--exit', '7', 'e2e/some.spec.js'],
    'configured args first as --key value pairs, then the forwarded tokens verbatim in user order',
  );
  assert.equal(receipt.cwd, project.dir, "the runner runs where the user's command ran");
});

/**
 * Test 6 — Ctrl+C tears down the RUN, and only the run (the CLI half of
 * interrupt handling; spec 010 pins the jest half). Against an explicitly
 * started `detox server`, a parked runner is
 * interrupted: the CLI exits non-success, the runner process is GONE (the
 * signal reached the child — the AbortSignal-first constraint at process
 * rank), the snapshot file is deleted on this exit path as well — and the
 * SERVER SURVIVES, because it is the operator's own process, not the run's:
 * a fresh dial succeeds after the interrupt. The interrupted run's devices
 * are the server's reclaim-on-close business, never the CLI's. The CLI
 * holds no timer: the observable contract is only death, not a schedule.
 * The `autostart: false` spelling makes this assertion permanent across
 * the post-alpha helper.
 */
test('Ctrl+C kills the runner and deletes the snapshot — the explicit server survives the run', async (t) => {
  await using serverVerb = await startDetoxServerVerb({ signal: t.signal });
  const project = await writeProject({
    '.detoxrc.js': {
      client: { server: serverVerb.url },
      server: { autostart: false },
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json', park: true } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });

  const cli = spawnDetoxCli(['test'], { cwd: project.dir, signal: t.signal });
  const receipt = await waitForProbeReceipt(project.path('receipt.json'), { signal: t.signal });
  assert.equal(receipt.initOk, true, 'the parked runner dialed the explicit server first');

  cli.interrupt();
  const result = await cli.wait();
  assert.notEqual(result.exitCode, 0, 'an interrupted run must not report success');

  await waitUntil(() => !isPidAlive(receipt.pid), {
    signal: t.signal,
    description: 'the parked runner process to die with the interrupt',
  });
  assert.ok(
    !existsSync(receipt.snapshotPath),
    'the snapshot is deleted on the interrupt path too',
  );

  const survivor = await connect({ server: { url: serverVerb.url }, signal: t.signal });
  await survivor.disconnect();
  // The interrupt killed the RUN; the operator's server kept serving —
  // that a fresh dial succeeded above IS the assertion (the server is never
  // the run's property).
});

/**
 * Test 7 — `detox build` runs the selected configuration's build
 * command where the user stands (the CLI's cwd, through the shell), and a
 * failing build fails the command. The build string is the user's own —
 * v20's contract, kept.
 */
test('detox build runs the configured build command in the project directory', async (t) => {
  const project = await writeProject({
    '.detoxrc.js': {
      apps: {
        app: {
          type: 'ios.app',
          name: 'example',
          bundleId: 'com.example.app',
          build: 'node -e "require(\'fs\').writeFileSync(\'built.marker\', \'ok\')"',
        },
      },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });

  const built = await runDetoxCli(['build', '-c', 'only'], { cwd: project.dir, signal: t.signal });
  assert.equal(built.exitCode, 0, `expected the build to pass, stderr:\n${built.stderr}`);
  assert.ok(
    existsSync(project.path('built.marker')),
    'the build command ran in the project directory',
  );

  const failing = await writeProject({
    '.detoxrc.js': {
      apps: {
        app: {
          type: 'ios.app',
          name: 'example',
          bundleId: 'com.example.app',
          build: 'node -e "process.exit(3)"',
        },
      },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });
  const failed = await runDetoxCli(['build', '-c', 'only'], { cwd: failing.dir, signal: t.signal });
  assert.notEqual(failed.exitCode, 0, 'a failing build command fails detox build');
});

/**
 * Test 8 — `detox server` (the verb; there is no `run-server`) starts the
 * standing device-owning server from the same installed package, and auth
 * is opt-in: with NO token configured the door is OPEN — a tokenless dial
 * succeeds, no token is generated; with a token configured the operator's
 * own token gets in and a stranger's is turned away typed. The IPC
 * readiness announce the helper waits on is part of the delegation
 * contract.
 */
test('detox server: an open door with no token configured, a guarded one with a token', async (t) => {
  await using openMac = await startDetoxServerVerb({ signal: t.signal });
  const openSession = await connect({ server: { url: openMac.url }, signal: t.signal });
  await openSession.disconnect();

  const token = 'spec009-home-mac-4f2a9c81d6e37b05';
  await using guardedMac = await startDetoxServerVerb({ token, signal: t.signal });
  const session = await connect({ server: bearerAddress(guardedMac.url, token), signal: t.signal });
  await session.disconnect();

  const stranger = assertDetoxError(
    await rejectionOf(
      connect({ server: bearerAddress(guardedMac.url, 'definitely-not-that-token'), signal: t.signal }),
      'dialing detox server with a wrong token',
    ),
    'wrong token',
  );
  assert.equal(
    stranger.code,
    DetoxErrorCode.DETOX_UNAUTHORIZED,
    'opted-in auth guards the door exactly as spec 003 pinned it',
  );
});

/**
 * Test 9 — the three-Mini farm in miniature, tokenless. A node comes up
 * via `detox server` with auth off; a SEPARATE
 * `detox relay` process fronts it with a roster entry that carries NO token
 * — the plainest alpha fleet, two Macs on a trusted LAN with auth off, must be
 * configurable; and a project whose config's `client.server` names the RELAY
 * runs exactly as if it named a server — same URL shape, same (absent) token
 * field, indistinguishable by design (spec 008's promise carried into the
 * config surface). Editing the config is ALL a project does to move from one
 * Mac to a farm.
 */
test('a tokenless relay over a tokenless node serves a run that cannot tell the difference', async (t) => {
  await using node = await startDetoxServerVerb({ signal: t.signal });
  const fleet = await writeProject({
    'nodes.json': [{ name: 'mini-2', url: node.url }],
  });
  await using relay = await startDetoxRelayVerb({
    nodesFile: fleet.path('nodes.json'),
    signal: t.signal,
  });
  const project = await writeProject({
    '.detoxrc.js': {
      client: { server: relay.url },
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });

  const result = await runDetoxCli(['test'], { cwd: project.dir, signal: t.signal });
  assert.equal(result.exitCode, 0, `expected the relay-pointed run to pass, stderr:\n${result.stderr}`);
  const receipt = await readProbeReceipt(project.path('receipt.json'));
  assert.equal(receipt.snapshot.client.server, relay.url);
  assert.ok(
    !('token' in receipt.snapshot.client),
    'no token was configured and none was invented anywhere along the chain',
  );
  assert.equal(receipt.initOk, true, 'the runner cannot tell a relay from a server — by design');
});

/**
 * Test 10 — `bundleId` is OPTIONAL: a config whose app names only a
 * `binaryPath` runs
 * — no refusal, and the snapshot carries NO invented id (derivation happens
 * client-side at `connect`, never at config resolution, so `detox build` on an
 * unbuilt app stays possible). A config with NEITHER `bundleId` nor
 * `binaryPath` is a typed refusal naming BOTH keys — never a deferred
 * failure.
 */
test('bundleId may be omitted when binaryPath exists; omitting both is a refusal naming both', async (t) => {
  await using server = await startServer({ dedicated: true, signal: t.signal });
  const project = await writeProject({
    '.detoxrc.js': {
      client: { server: server.url, token: tokenOf(server.address) },
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
      apps: {
        app: {
          type: 'ios.app',
          name: 'example',
          binaryPath: 'ios/build/Release-iphonesimulator/example.app',
        },
      },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });

  const result = await runDetoxCli(['test'], { cwd: project.dir, signal: t.signal });
  assert.equal(result.exitCode, 0, `a binaryPath-only app must run, stderr:\n${result.stderr}`);
  const receipt = await readProbeReceipt(project.path('receipt.json'));
  assert.ok(
    !('bundleId' in receipt.snapshot.apps[0]),
    'the snapshot never invents a bundleId — derivation is client-side at init',
  );

  const neither = await writeProject({
    '.detoxrc.js': {
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
      apps: { app: { type: 'ios.app', name: 'example' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });
  const refused = await runDetoxCli(['test'], { cwd: neither.dir, signal: t.signal });
  assert.notEqual(refused.exitCode, 0, 'an app with neither bundleId nor binaryPath cannot run');
  assert.ok(
    refused.stderr.includes('bundleId') && refused.stderr.includes('binaryPath'),
    `the refusal names both missing keys, got:\n${refused.stderr}`,
  );
  assert.ok(
    !existsSync(neither.path('receipt.json')),
    'the refusal happened at config time, never as a deferred runner failure',
  );
});

/**
 * Test 11 — legacy keys are signposts, not adapters. A v20 `session`
 * block is a refusal that
 * NAMES the new spelling — the migrant learns `client` from the error
 * itself; a v19 string `testRunner` is a refusal naming the key. Neither
 * ever spawns the runner.
 */
test('a v20 session block and a v19 string testRunner refuse with signposts, never translate', async (t) => {
  const sessionProject = await writeProject({
    '.detoxrc.js': {
      session: { server: 'ws://127.0.0.1:8099', token: 'irrelevant' },
      testRunner: { args: { $0: probeCommand(), receipt: 'receipt.json' } },
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });
  const sessionRefusal = await runDetoxCli(['test'], { cwd: sessionProject.dir, signal: t.signal });
  assert.notEqual(sessionRefusal.exitCode, 0, 'the v20 session block gets no adapter');
  assert.ok(
    sessionRefusal.stderr.includes('session') && sessionRefusal.stderr.includes('client'),
    `the refusal is a signpost naming the new spelling, got:\n${sessionRefusal.stderr}`,
  );
  assert.ok(
    !existsSync(sessionProject.path('receipt.json')),
    'a legacy-key refusal never spawns the runner',
  );

  const v19Project = await writeProject({
    '.detoxrc.js': {
      testRunner: 'jest',
      apps: { app: { type: 'ios.app', name: 'example', bundleId: 'com.example.app' } },
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      configurations: { only: { device: 'sim', app: 'app' } },
    },
  });
  const v19Refusal = await runDetoxCli(['test'], { cwd: v19Project.dir, signal: t.signal });
  assert.notEqual(v19Refusal.exitCode, 0, 'v19-era keys refuse rather than half-work');
  assert.ok(
    v19Refusal.stderr.includes('testRunner'),
    `the refusal names the offending key, got:\n${v19Refusal.stderr}`,
  );
});
