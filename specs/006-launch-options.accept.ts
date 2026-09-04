/**
 * Acceptance: spec 006 — launch options: argv, payloads, permissions,
 * foreground.
 *
 * This file is frozen and append-only.
 *
 * Style is part of the contract: tests are STRAIGHT-LINE — a fence of awaits
 * against the public dialect, no function definitions in this file. The one
 * typed door (`launchingOf`) is applied once per test, right after
 * allocation, and collapses to the identity when the implementation lands.
 * Every error code named here is already minted in the registry — no
 * placeholder pins.
 *
 * What is being proven, end to end through the public dialect:
 *  - launch arguments and language/locale physically land on the launched
 *    process's argv line (ps is ground truth), and the four reserved keys
 *    are refused BEFORE any side effect;
 *  - at-launch payloads cross as VALUES the server materializes to its own
 *    file (never a client path; relay-safe by shape);
 *  - the launch ready timeout belongs to the caller, and `0` legally means
 *    "no server-side timeout — my signal is the only exit";
 *  - `setPermissions` is its own device verb with externally observable
 *    effect, and v20's silent holes (unknown key, unknown value) are typed
 *    refusals here;
 *  - `foreground()` is a RESUME: same OS process, no second handshake, and
 *    the app's own `waitForActiveDone` — not a server guess — resolves it;
 *  - app-state waits and live payload delivery ride the frozen dialect and
 *    settle only on the app's own word (the server adapts to the app).
 *
 * The testee policy (003's fixture policy): tests 1–6 launch a real stub
 * process and play its WIRE role with the protocol-faithful fake
 * (`impersonateLaunchedApp`); test 7 drops the fake — the REAL minimal app
 * with the REAL injected instrumentation goes home and comes back alive.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { connect, DetoxErrorCode } from 'detox/client';

import { startServer } from './helpers/server';
import { assertDetoxError, rejectionOf } from './helpers/errors';
import { buildStubAppExternally } from './helpers/apps';
import {
  argvValueOf,
  discoverDetoxApps,
  impersonateLaunchedApp,
} from './helpers/fake-app';
import { buildHelloAppExternally, resolveDetoxFrameworkExternally } from './helpers/real-app';
import { launchingOf } from './helpers/launch-door';
import { tccServiceStateExternally } from './helpers/permissions';
import {
  createSimulatorExternally,
  deleteSimulatorExternally,
  shutdownSimulatorExternally,
} from './helpers/simctl';

/**
 * The four keys `launchArgs` refuses: the frozen pair whose
 * displacement would repoint the app at another server, and the two payload
 * path keys that would smuggle a client path around the value rule. NOT a
 * `detox*` blanket — test 1 passes `detoxEnableSynchronization` through on
 * purpose, because the corpus does.
 */
const RESERVED_LAUNCH_ARG_KEYS = [
  'detoxServer',
  'detoxSessionId',
  'detoxUserNotificationDataURL',
  'detoxUserActivityDataURL',
];

/** A corpus-shaped notification payload — nested, non-ASCII, a VALUE. */
const NOTIFICATION_VALUE = {
  trigger: { type: 'push' },
  title: 'From spec 006',
  payload: { answer: 42, note: 'a value, not a path' },
};

/** The spec's payload cap: 1 MiB of serialized JSON (UTF-8). */
const PAYLOAD_VALUE_MAX_BYTES = 1_048_576;

/**
 * Test 1 — launch options land on the argv line; reserved keys are
 * refused before any side effect.
 *
 * `launchArgs` become `-key value` argv pairs with v20 iOS stringification
 * (numbers and booleans stringify; `detoxEnableSynchronization` passes —
 * `detox*` is NOT blanket-reserved); `languageAndLocale` becomes
 * `-AppleLanguages (lang)` / `-AppleLocale`; the frozen `-detoxServer` /
 * `-detoxSessionId` convention survives untouched next to user args. Each
 * of the four reserved keys answers `DETOX_INVALID_ARGUMENT` — and the
 * refusals leave the RUNNING instance alive: validation precedes
 * terminate-first, so a bad option can never cost the caller their app.
 */
test('launch args become argv; reserved keys refuse without side effects', async (t) => {
  const probe = await createSimulatorExternally('detox-spec006-argv', t.signal);
  const bundleId = 'com.detox.spec006.argv';
  try {
    await using server = await startServer({ signal: t.signal });
    await using detox = await connect({ server: server.address, signal: t.signal });
    await using device = launchingOf(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } }),
    );
    const appPath = await buildStubAppExternally(bundleId, t.signal);
    await device.installApp(appPath);

    const launching = device.launchApp(bundleId, {
      launchArgs: { mockServerPort: 9001, detoxEnableSynchronization: 0, isHermes: true },
      languageAndLocale: { language: 'es-MX', locale: 'en_MX' },
      signal: t.signal,
    });
    await using fake = await impersonateLaunchedApp(probe.udid, bundleId, { signal: t.signal });
    assert.equal(
      argvValueOf(fake.process.command, '-mockServerPort'),
      '9001',
      'a number launch arg is stringified onto argv (v20 iOS parity)',
    );
    assert.equal(
      argvValueOf(fake.process.command, '-isHermes'),
      'true',
      'a boolean launch arg is stringified onto argv',
    );
    assert.equal(
      argvValueOf(fake.process.command, '-detoxEnableSynchronization'),
      '0',
      'detox* is NOT blanket-reserved: the corpus passes this key',
    );
    assert.equal(
      argvValueOf(fake.process.command, '-AppleLanguages'),
      '(es-MX)',
      'languageAndLocale.language becomes the NSUserDefaults array literal',
    );
    assert.equal(
      argvValueOf(fake.process.command, '-AppleLocale'),
      'en_MX',
      'languageAndLocale.locale becomes -AppleLocale',
    );
    assert.equal(
      fake.process.detoxSessionId,
      bundleId,
      'the frozen convention survives next to user launch args',
    );
    fake.markReady();
    const app = await launching;

    for (const key of RESERVED_LAUNCH_ARG_KEYS) {
      const refused = device.launchApp(bundleId, {
        launchArgs: { [key]: 'ws://evil.example:1' },
        signal: t.signal,
      });
      const err = assertDetoxError(await rejectionOf(refused, `reserved key ${key}`), `reserved key ${key}`);
      assert.equal(
        err.code,
        DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        `launchArgs.${key} is refused with 2011`,
      );
    }
    const survivors = await discoverDetoxApps(probe.udid, t.signal);
    assert.ok(
      survivors.some((candidate) => candidate.pid === fake.process.pid),
      'every refusal left the running instance alive: validation precedes terminate-first',
    );
    assert.equal(
      fake.received.filter((message) => message.type === 'isReady').length,
      1,
      'no relaunch happened underneath the refusals — one handshake, one ready probe',
    );
    assert.equal(app.pid, fake.process.pid, 'the surviving handle still names the real process');
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 2 — at-launch payloads are VALUES the server materializes.
 *
 * `userNotification` crosses the wire as JSON; the argv names a
 * server-minted absolute path whose file content deep-equals the value
 * (client and server share this machine — locality itself is untestable in
 * the accept dialect — but the path is provably
 * server-composed: the client was never handed one). The `url` form rides
 * `-detoxURLOverride`/`-detoxSourceAppOverride`. Two payloads at once and
 * an oversized value are `DETOX_INVALID_ARGUMENT`, refused server-side.
 */
test('at-launch payloads cross as values, never as client paths', async (t) => {
  const probe = await createSimulatorExternally('detox-spec006-payload', t.signal);
  const bundleId = 'com.detox.spec006.payload';
  try {
    await using server = await startServer({ signal: t.signal });
    await using detox = await connect({ server: server.address, signal: t.signal });
    await using device = launchingOf(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } }),
    );
    const appPath = await buildStubAppExternally(bundleId, t.signal);
    await device.installApp(appPath);

    const launching = device.launchApp(bundleId, {
      userNotification: NOTIFICATION_VALUE,
      signal: t.signal,
    });
    await using fake = await impersonateLaunchedApp(probe.udid, bundleId, { signal: t.signal });
    const notificationPath = argvValueOf(fake.process.command, '-detoxUserNotificationDataURL');
    assert.ok(notificationPath, 'argv names the materialized payload file');
    assert.ok(
      notificationPath.startsWith('/'),
      'the payload path is absolute and server-minted — the client sent only a value',
    );
    assert.deepEqual(
      JSON.parse(await readFile(notificationPath, 'utf8')),
      NOTIFICATION_VALUE,
      'the file the app will read holds the exact value the caller passed',
    );
    fake.markReady();
    await launching;

    const relaunching = device.launchApp(bundleId, {
      url: 'detoxtesturlscheme://spec-006?arg=value',
      sourceApp: 'com.detox.spec006.source',
      signal: t.signal,
    });
    await using successor = await impersonateLaunchedApp(probe.udid, bundleId, {
      signal: t.signal,
      excludePid: fake.process.pid,
    });
    assert.equal(
      argvValueOf(successor.process.command, '-detoxURLOverride'),
      'detoxtesturlscheme://spec-006?arg=value',
      'the at-launch URL payload rides the v20 argv spelling',
    );
    assert.equal(
      argvValueOf(successor.process.command, '-detoxSourceAppOverride'),
      'com.detox.spec006.source',
      'sourceApp rides along',
    );
    successor.markReady();
    await relaunching;

    const both = device.launchApp(bundleId, {
      url: 'detoxtesturlscheme://x',
      userNotification: NOTIFICATION_VALUE,
      signal: t.signal,
    });
    const bothErr = assertDetoxError(await rejectionOf(both, 'two payloads at once'), 'two payloads at once');
    assert.equal(
      bothErr.code,
      DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      'payload mutual exclusivity is enforced (server-side)',
    );

    const oversized = device.launchApp(bundleId, {
      userNotification: { blob: 'é'.repeat(PAYLOAD_VALUE_MAX_BYTES) },
      signal: t.signal,
    });
    const capErr = assertDetoxError(await rejectionOf(oversized, 'oversized payload'), 'oversized payload');
    assert.equal(
      capErr.code,
      DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      'a payload beyond the 1 MiB cap is a typed refusal, not an accepted write',
    );
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 3 — the launch ready timeout belongs to the caller.
 *
 * The stub speaks no Detox and nobody impersonates it, so the handshake can
 * never complete: with `readyTimeoutMs: 3000` the verb must fail TYPED
 * (`DETOX_APP_DIED`) in seconds — far under the 120 s default, proving the
 * parameter governed. With `readyTimeoutMs: 0` there is NO server-side
 * timeout: the caller's own signal is the only exit, and the outcome is the
 * abort, not a timeout verdict (`0` must not mean "instantly").
 */
test('readyTimeoutMs is the caller parameter; 0 legally disables the timeout', async (t) => {
  const probe = await createSimulatorExternally('detox-spec006-deadline', t.signal);
  const bundleId = 'com.detox.spec006.deadline';
  try {
    await using server = await startServer({ signal: t.signal });
    await using detox = await connect({ server: server.address, signal: t.signal });
    await using device = launchingOf(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } }),
    );
    const appPath = await buildStubAppExternally(bundleId, t.signal);
    await device.installApp(appPath);

    const startedAt = Date.now();
    const expired = device.launchApp(bundleId, { readyTimeoutMs: 3000, signal: t.signal });
    const err = assertDetoxError(await rejectionOf(expired, 'ready-timeout expiry'), 'ready-timeout expiry');
    const elapsedMs = Date.now() - startedAt;
    assert.equal(
      err.code,
      DetoxErrorCode.DETOX_APP_DIED,
      'ready-timeout expiry is the typed handshake verdict',
    );
    assert.ok(
      elapsedMs >= 2500,
      `the caller's ready timeout was honored, not shortcut (${elapsedMs}ms elapsed)`,
    );
    assert.ok(
      elapsedMs < 90_000,
      `the caller's ready timeout governed — not the 120 s default (${elapsedMs}ms elapsed)`,
    );

    const walkAway = AbortSignal.any([t.signal, AbortSignal.timeout(4000)]);
    const unbounded = device.launchApp(bundleId, { readyTimeoutMs: 0, signal: walkAway });
    const abortErr = assertDetoxError(await rejectionOf(unbounded, 'readyTimeoutMs 0'), 'readyTimeoutMs 0');
    assert.equal(
      abortErr.code,
      DetoxErrorCode.DETOX_ABORTED,
      'readyTimeoutMs: 0 = no server-side timeout; the signal is the only exit — and 0 is not "instantly"',
    );
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 4 — setPermissions is its own device verb with real effect.
 *
 * TCC is ground truth: `camera` exercises the simctl-privacy backend,
 * `photos` (YES/NO) the applesimutils backend — both must land in the
 * simulator's own TCC database. v20's two silent holes are typed refusals
 * here: an unknown service key and an unknown value each answer
 * `DETOX_INVALID_ARGUMENT` (v20 falls through its switch, or composes
 * `simctl privacy <udid> undefined …`). After release, the uniform
 * stale-handle refusal — ownership is checked first, always.
 */
test('setPermissions grants, revokes and resets for real; unknowns are typed refusals', async (t) => {
  const probe = await createSimulatorExternally('detox-spec006-perms', t.signal);
  const bundleId = 'com.detox.spec006.perms';
  try {
    await using server = await startServer({ signal: t.signal });
    await using detox = await connect({ server: server.address, signal: t.signal });
    await using device = launchingOf(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } }),
    );

    await device.setPermissions(bundleId, { camera: 'YES', photos: 'YES' }, { signal: t.signal });
    assert.equal(
      await tccServiceStateExternally(probe.udid, 'camera', bundleId, t.signal),
      'granted',
      'the simctl-privacy-backed grant really landed in TCC',
    );
    assert.equal(
      await tccServiceStateExternally(probe.udid, 'photos', bundleId, t.signal),
      'granted',
      'the applesimutils-backed grant really landed in TCC',
    );

    await device.setPermissions(bundleId, { camera: 'NO' }, { signal: t.signal });
    assert.equal(
      await tccServiceStateExternally(probe.udid, 'camera', bundleId, t.signal),
      'denied',
      'NO revokes',
    );

    await device.setPermissions(bundleId, { camera: 'unset' }, { signal: t.signal });
    assert.equal(
      await tccServiceStateExternally(probe.udid, 'camera', bundleId, t.signal),
      'absent',
      'unset resets to no-verdict',
    );

    const unknownService = device.setPermissions(bundleId, { frobnicator: 'YES' }, { signal: t.signal });
    const serviceErr = assertDetoxError(
      await rejectionOf(unknownService, 'unknown permission service'),
      'unknown permission service',
    );
    assert.equal(
      serviceErr.code,
      DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      "an unknown service is a typed refusal — v20's silent switch fall-through is closed",
    );

    const unknownValue = device.setPermissions(bundleId, { camera: 'MAYBE' }, { signal: t.signal });
    const valueErr = assertDetoxError(
      await rejectionOf(unknownValue, 'unknown permission value'),
      'unknown permission value',
    );
    assert.equal(
      valueErr.code,
      DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      "an unknown value is a typed refusal — v20's `simctl privacy … undefined` hole is closed",
    );

    await device.release();
    const stale = device.setPermissions(bundleId, { camera: 'YES' }, { signal: t.signal });
    const staleErr = assertDetoxError(await rejectionOf(stale, 'stale setPermissions'), 'stale setPermissions');
    assert.equal(staleErr.code, DetoxErrorCode.DETOX_STALE_HANDLE, 'ownership is checked first');
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 5 — foreground is a RESUME, not a second launch.
 *
 * After `sendToHome` (public on the client as of this spec), `foreground()`
 * must (a) stay pending until the app's own `waitForActiveDone` — the
 * server never guesses app state; (b) keep the SAME OS process — a resume
 * performs no new launch transaction: no terminate-first, no second
 * handshake, no second ready probe;
 * (c) keep the same handle working. A terminated handle is a tombstone:
 * foreground answers the app-death verdict, it cannot resurrect.
 */
test('foreground resumes the same process and settles on the app\'s own word', async (t) => {
  const probe = await createSimulatorExternally('detox-spec006-resume', t.signal);
  const bundleId = 'com.detox.spec006.resume';
  try {
    await using server = await startServer({ signal: t.signal });
    await using detox = await connect({ server: server.address, signal: t.signal });
    await using device = launchingOf(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } }),
    );
    const appPath = await buildStubAppExternally(bundleId, t.signal);
    await device.installApp(appPath);

    const launching = device.launchApp(bundleId, { signal: t.signal });
    await using fake = await impersonateLaunchedApp(probe.udid, bundleId, { signal: t.signal });
    fake.markReady();
    const app = await launching;

    await device.sendToHome({ signal: t.signal });

    const foregrounding = app.foreground({ signal: t.signal });
    let foregroundSettled = false;
    foregrounding.then(() => (foregroundSettled = true), () => (foregroundSettled = true));
    const activeProbe = await fake.nextMessage((message) => message.type === 'waitForActive');
    assert.equal(
      foregroundSettled,
      false,
      'foreground is gated on the app: the frame went out, the verb still pends',
    );
    fake.send({ type: 'waitForActiveDone', messageId: activeProbe.messageId, params: {} });
    await foregrounding;

    const survivors = await discoverDetoxApps(probe.udid, t.signal);
    assert.ok(
      survivors.some((candidate) => candidate.pid === fake.process.pid),
      'same OS process after foreground — a resume performs no new launch transaction',
    );
    assert.equal(
      fake.received.filter((message) => message.type === 'isReady').length,
      1,
      'no second handshake: exactly one ready probe over the whole life of this instance',
    );
    assert.equal(app.pid, fake.process.pid, 'the handle still names the resumed process');

    await app.terminate({ signal: t.signal });
    const resurrect = app.foreground({ signal: t.signal });
    const deadErr = assertDetoxError(
      await rejectionOf(resurrect, 'foreground after terminate'),
      'foreground after terminate',
    );
    assert.equal(
      deadErr.code,
      DetoxErrorCode.DETOX_APP_DIED,
      'a dead handle is a tombstone — foreground cannot resurrect it',
    );
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 6 — app-state waits and live payload delivery settle only on
 * the app's own word.
 *
 * `waitForBackground` relays the frozen frame and stays pending until the
 * app answers `waitForBackgroundDone`. `sendUserNotification` on a LIVE app
 * rides the frozen `deliverPayload` frame: the server materializes the
 * VALUE to its own file and the frame carries that path (never
 * `delayPayload: true` unless the caller asked); the verb resolves on
 * `deliverPayloadDone`.
 */
test('state waits and live payloads ride the frozen dialect, settled by the app', async (t) => {
  const probe = await createSimulatorExternally('detox-spec006-live', t.signal);
  const bundleId = 'com.detox.spec006.live';
  try {
    await using server = await startServer({ signal: t.signal });
    await using detox = await connect({ server: server.address, signal: t.signal });
    await using device = launchingOf(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } }),
    );
    const appPath = await buildStubAppExternally(bundleId, t.signal);
    await device.installApp(appPath);

    const launching = device.launchApp(bundleId, { signal: t.signal });
    await using fake = await impersonateLaunchedApp(probe.udid, bundleId, { signal: t.signal });
    fake.markReady();
    const app = await launching;

    const waitingForBackground = app.waitForBackground({ signal: t.signal });
    let backgroundSettled = false;
    waitingForBackground.then(() => (backgroundSettled = true), () => (backgroundSettled = true));
    const backgroundProbe = await fake.nextMessage((message) => message.type === 'waitForBackground');
    assert.equal(
      backgroundSettled,
      false,
      "the wait pends until the app's own word — the server keeps no state shadow",
    );
    fake.send({ type: 'waitForBackgroundDone', messageId: backgroundProbe.messageId, params: {} });
    await waitingForBackground;

    const delivering = app.sendUserNotification(NOTIFICATION_VALUE, { signal: t.signal });
    const payloadFrame = await fake.nextMessage((message) => message.type === 'deliverPayload');
    const framePath = payloadFrame.params?.detoxUserNotificationDataURL;
    assert.ok(
      typeof framePath === 'string' && framePath.startsWith('/'),
      'the frozen frame carries a server-minted absolute path, never the raw value',
    );
    assert.deepEqual(
      JSON.parse(await readFile(String(framePath), 'utf8')),
      NOTIFICATION_VALUE,
      'the materialized file holds the exact value the caller passed',
    );
    assert.notEqual(
      payloadFrame.params?.delayPayload,
      true,
      'an immediate delivery does not smuggle a delay flag',
    );
    fake.send({ type: 'deliverPayloadDone', messageId: payloadFrame.messageId, params: {} });
    await delivering;
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 7 — the real instrumented app goes home and comes back.
 *
 * No fake anywhere: the REAL minimal app with the REAL injected
 * instrumentation launches, proves its session with one tap, goes home via
 * `sendToHome`, and `foreground()` resolves on the real native's own
 * `waitForActiveDone` — after which the SAME session still answers element
 * traffic. This is the product promise of the whole spec: backgrounding an
 * app costs nothing — not the process, not the handle, not the session.
 *
 * Suite precondition (003's, verbatim): the Detox framework cache —
 * `detox build-framework-cache` — once per Xcode/Detox version.
 */
test('the real app survives home-and-back: same process, same live session', async (t) => {
  const probe = await createSimulatorExternally('detox-spec006-real', t.signal);
  const bundleId = 'com.detox.spec006.real';
  try {
    const frameworkPath = await resolveDetoxFrameworkExternally(t.signal);
    await using server = await startServer({
      dedicated: true,
      iosDetoxFrameworkPath: frameworkPath,
      signal: t.signal,
    });
    await using detox = await connect({ server: server.address, signal: t.signal });
    await using device = launchingOf(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } }),
    );
    const appPath = await buildHelloAppExternally(bundleId, t.signal);
    await device.installApp(appPath);

    const app = await device.launchApp(bundleId, { signal: t.signal });
    const { by, element, expect: expectElement } = app;
    await element(by.text('Say Hello')).tap();
    await expectElement(element(by.text('Hello!!!'))).toBeVisible();

    await device.sendToHome({ signal: t.signal });
    await app.foreground({ signal: t.signal });

    const survivors = await discoverDetoxApps(probe.udid, t.signal);
    assert.ok(
      survivors.some((candidate) => candidate.pid === app.pid),
      'the real app kept its OS process across home-and-back',
    );
    await expectElement(element(by.text('Say Hello'))).toBeVisible();
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 8 (added after the first seven) — a deep link reaches a RUNNING app
 * over the frozen dialect. `app.openURL` is the only client door onto the
 * server's `deliverPayload {url}`, and a public contract method needs an
 * acceptance test.
 *
 * What is proven: the URL crosses as a VALUE on the frozen frame (a URL is
 * already one — nothing is materialized, unlike a notification), `sourceApp`
 * rides along when given, the verb settles only on the app's own
 * `deliverPayloadDone`, and `delayUntilActive` is the only thing that may
 * set `delayPayload`. Delivery through the APP is also what keeps the
 * device safe: the device-level `simctl openurl` lane raises a SpringBoard
 * confirmation on iOS 26 that strands the simulator.
 */
test('openURL hands a deep link to the live app, settled by the app', async (t) => {
  const probe = await createSimulatorExternally('detox-spec006-openurl', t.signal);
  const bundleId = 'com.detox.spec006.openurl';
  try {
    await using server = await startServer({ signal: t.signal });
    await using detox = await connect({ server: server.address, signal: t.signal });
    await using device = launchingOf(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } }),
    );
    const appPath = await buildStubAppExternally(bundleId, t.signal);
    await device.installApp(appPath);

    const launching = device.launchApp(bundleId, { signal: t.signal });
    await using fake = await impersonateLaunchedApp(probe.udid, bundleId, { signal: t.signal });
    fake.markReady();
    const app = await launching;

    const opening = app.openURL('detoxtesturlscheme://spec-006/live?arg=value', {
      signal: t.signal,
    });
    let openSettled = false;
    opening.then(() => (openSettled = true), () => (openSettled = true));
    const urlFrame = await fake.nextMessage((message) => message.type === 'deliverPayload');
    assert.equal(
      urlFrame.params?.url,
      'detoxtesturlscheme://spec-006/live?arg=value',
      'the frozen frame carries the URL verbatim, as a value — nothing is materialized',
    );
    assert.equal(
      urlFrame.params?.detoxUserNotificationDataURL,
      undefined,
      'a URL delivery smuggles no payload path key',
    );
    assert.notEqual(
      urlFrame.params?.delayPayload,
      true,
      'an immediate delivery does not smuggle a delay flag',
    );
    assert.equal(
      openSettled,
      false,
      "openURL pends on the app's own word — the server never answers for the app",
    );
    fake.send({ type: 'deliverPayloadDone', messageId: urlFrame.messageId, params: {} });
    await opening;

    const attributed = app.openURL('detoxtesturlscheme://spec-006/from-safari', {
      sourceApp: 'com.apple.mobilesafari',
      delayUntilActive: true,
      signal: t.signal,
    });
    const attributedFrame = await fake.nextMessage(
      (message) => message.type === 'deliverPayload' && message.messageId !== urlFrame.messageId,
    );
    assert.equal(
      attributedFrame.params?.sourceApp,
      'com.apple.mobilesafari',
      'sourceApp rides the frame — "another app opened us" survives the live lane',
    );
    assert.equal(
      attributedFrame.params?.delayPayload,
      true,
      'delayUntilActive parks the delivery until the next activation (v20 spelling)',
    );
    fake.send({ type: 'deliverPayloadDone', messageId: attributedFrame.messageId, params: {} });
    await attributed;

    await app.terminate({ signal: t.signal });
    const orphaned = app.openURL('detoxtesturlscheme://spec-006/dead', { signal: t.signal });
    const deadErr = assertDetoxError(
      await rejectionOf(orphaned, 'openURL after terminate'),
      'openURL after terminate',
    );
    assert.equal(
      deadErr.code,
      DetoxErrorCode.DETOX_APP_DIED,
      'a dead handle is a tombstone here too — no silent drop of a deep link',
    );
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});
