/**
 * Acceptance: spec 003 — the app gateway mechanism.
 *
 * This file is frozen and append-only.
 *
 * Style is part of the contract: tests are STRAIGHT-LINE — a fence of awaits
 * against the public dialect, no function definitions in this file. The one
 * typed shim (`appsOf`) is applied once per test, right after allocation, so
 * every later line reads as the product: `device.installApp(...)`,
 * `device.launchApp(...)` — and collapses to the identity when the
 * implementation lands.
 *
 * What is being proven, end to end through the public dialect: that
 * `device.launchApp(bundleId)` really launches a process on the simulator
 * with the frozen launch-argument convention, waits for the app's own
 * `ready`, and hands back a handle whose `element`/`expect` traffic rides
 * the frozen native dialect `{type, messageId, params}` VERBATIM.
 * `device.installApp(path)` plants the fixtures — under the original interim
 * semantics the path named a file on the SERVER's machine; the upload flow
 * (spec 007) superseded that transport.
 *
 * The testee policy (spec 003 "Fixture policy"): tests 1–5 launch a real
 * stub process and play its WIRE role with a protocol-faithful fake
 * (`impersonateLaunchedApp`) that throws exactly where a real app would
 * crash — a frame without a numeric `messageId`, an action type the frozen
 * native switch does not know. Test 6 drops the fake entirely: the REAL
 * minimal app with the REAL injected instrumentation runs the sanity trio.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { connect, DetoxErrorCode } from 'detox/client';

import { startServer } from './helpers/server';
import { assertDetoxError, rejectionOf } from './helpers/errors';
import { buildStubAppExternally } from './helpers/apps';
import { impersonateLaunchedApp, waitForAppProcessExit } from './helpers/fake-app';
import { buildHelloAppExternally, resolveDetoxFrameworkExternally } from './helpers/real-app';
// The URL-install test's fixture server.
import { serveZippedAppExternally } from './helpers/archive-server';
import { APP_GATEWAY_CODES, appsOf } from './helpers/typed-door';
import {
  createSimulatorExternally,
  deleteSimulatorExternally,
  shutdownSimulatorExternally,
} from './helpers/simctl';

/**
 * Frozen-dialect fixtures, byte-for-byte from Detox 20's own serializer
 * tests (`detox/src/ios/expectTwo.test.js:31-41` and `:381-392`) — the
 * exact `params` of an `invoke` the real native side accepts. Deep-equality
 * against these is the point: the server adapts to the app, never the
 * reverse.
 */
const TAP_INVOCATION = {
  type: 'action',
  action: 'tap',
  predicate: { type: 'text', value: 'tapMe', isRegex: false },
};
const VISIBLE_INVOCATION = {
  type: 'expectation',
  predicate: { type: 'text', value: 'Tap Working!!!', isRegex: false },
  expectation: 'toBeVisible',
};

/** Loopback spellings a URL's hostname may legitimately use. */
const LOOPBACK_HOSTNAMES = ['127.0.0.1', 'localhost', '[::1]'];

/**
 * Test 1 — launchApp is a handshake, not a fire-and-forget.
 *
 * `installApp` really installs (the launch below depends on it — a broken
 * install cannot pass vacuously); the server really `simctl launch`es a
 * process (argv is ground truth); the launch args follow the frozen
 * NSUserDefaults convention with `detoxSessionId` equal to the app's own
 * bundle id (the frozen native DEFAULT: `DetoxManager.swift:120-130`); the
 * gateway URL is loopback and dialable VERBATIM (a real app can send no
 * headers — identity is the session id; no tokens on the app port); login
 * is answered (`loginSuccess` echoing the login's own messageId — the native
 * force-unwraps it); readiness is probed with the frozen `isReady` sentinel;
 * and `launchApp` must NOT resolve before the app itself says `ready`. After
 * the device is released, a further launch is refused with the uniform
 * stale-handle error (ownership is checked first, always).
 */
test('launchApp is a handshake: real process, frozen launch args, ready gates resolution', async (t) => {
  const probe = await createSimulatorExternally('detox-spec003-handshake', t.signal);
  const bundleId = 'com.detox.spec003.hello';
  try {
    await using server = await startServer({ signal: t.signal });
    await using detox = await connect({ server: server.address, signal: t.signal });
    await using device = appsOf(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } }),
    );
    const appPath = await buildStubAppExternally(bundleId, t.signal);
    await device.installApp(appPath);

    const launching = device.launchApp(bundleId, { signal: t.signal });
    let launchSettled = false;
    launching.then(() => (launchSettled = true), () => (launchSettled = true));

    await using fake = await impersonateLaunchedApp(probe.udid, bundleId, { signal: t.signal });
    assert.equal(
      fake.process.detoxSessionId,
      bundleId,
      'the session id IS the bundle id (the frozen native default)',
    );
    const gatewayUrl = new URL(fake.process.detoxServer);
    assert.ok(
      gatewayUrl.protocol === 'ws:' || gatewayUrl.protocol === 'wss:',
      'the gateway address is a websocket URL',
    );
    assert.ok(
      LOOPBACK_HOSTNAMES.includes(gatewayUrl.hostname),
      'the gateway binds loopback by default — apps talk over localhost',
    );
    assert.equal(
      fake.loginReply.messageId,
      0,
      'loginSuccess echoes the login messageId (the native hardcodes 0 and force-unwraps the reply)',
    );

    const isReady = await fake.nextMessage((message) => message.type === 'isReady');
    assert.equal(isReady.messageId, -1000, 'readiness is probed with the frozen sentinel id');
    assert.equal(launchSettled, false, 'launchApp must still be pending: the app has not said ready');

    fake.markReady();
    const app = await launching;
    assert.equal(app.bundleId, bundleId);
    assert.equal(app.pid, fake.process.pid, 'the handle names the real OS process');

    const { by, element, expect: expectElement, waitFor } = app;
    assert.equal(typeof by.id, 'function');
    assert.equal(typeof element, 'function');
    assert.equal(typeof expectElement, 'function');
    assert.equal(typeof waitFor, 'function');

    await device.release();
    const staleLaunch = device.launchApp(bundleId, { signal: t.signal });
    const err = assertDetoxError(await rejectionOf(staleLaunch, 'launch after release'), 'launch after release');
    assert.equal(err.code, DetoxErrorCode.DETOX_STALE_HANDLE, 'ownership is checked first');
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 2 — element traffic rides the frozen dialect verbatim.
 *
 * A tap and a visibility expectation must arrive at the app as EXACTLY the
 * `invoke` params Detox 20's serializer produces (deep-equal against
 * fixtures lifted from its own tests). Each request carries a fresh,
 * strictly increasing numeric messageId; the reply correlates by it.
 * `invokeResult` settles the caller; `testFailed` surfaces as a typed
 * expectation failure that PRESERVES the app's own details text.
 */
test('element actions ride the frozen dialect verbatim and correlate by messageId', async (t) => {
  const probe = await createSimulatorExternally('detox-spec003-dialect', t.signal);
  const bundleId = 'com.detox.spec003.dialect';
  try {
    await using server = await startServer({ signal: t.signal });
    await using detox = await connect({ server: server.address, signal: t.signal });
    await using device = appsOf(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } }),
    );
    const appPath = await buildStubAppExternally(bundleId, t.signal);
    await device.installApp(appPath);

    const launching = device.launchApp(bundleId, { signal: t.signal });
    await using fake = await impersonateLaunchedApp(probe.udid, bundleId, { signal: t.signal });
    await fake.handshake();
    const app = await launching;
    const { by, element, expect: expectElement } = app;

    const tapping = element(by.text('tapMe')).tap();
    const tapFrame = await fake.nextMessage((message) => message.type === 'invoke');
    assert.deepEqual(tapFrame.params, TAP_INVOCATION, 'tap serializes byte-for-byte as Detox 20');
    assert.ok(Number.isInteger(tapFrame.messageId), 'invoke ids are integers');
    assert.ok(tapFrame.messageId >= 0, 'invoke ids never collide with frozen sentinels');
    fake.send({ type: 'invokeResult', messageId: tapFrame.messageId, params: {} });
    await tapping;

    const passing = expectElement(element(by.text('Tap Working!!!'))).toBeVisible();
    const passFrame = await fake.nextMessage((message) => message.type === 'invoke');
    assert.deepEqual(passFrame.params, VISIBLE_INVOCATION);
    fake.send({ type: 'invokeResult', messageId: passFrame.messageId, params: {} });
    await passing;

    const failing = expectElement(element(by.text('Tap Working!!!'))).toBeVisible();
    const failFrame = await fake.nextMessage((message) => message.type === 'invoke');
    assert.deepEqual(failFrame.params, VISIBLE_INVOCATION);
    fake.send({
      type: 'testFailed',
      messageId: failFrame.messageId,
      params: { details: 'spec003-unseen-element' },
    });
    const err = assertDetoxError(await rejectionOf(failing, 'failed expectation'), 'failed expectation');
    assert.equal(err.code, APP_GATEWAY_CODES.DETOX_EXPECTATION_FAILED);
    assert.ok(
      JSON.stringify(err.details ?? {}).includes('spec003-unseen-element'),
      "the app's own failure details must survive into the typed error",
    );

    assert.ok(
      tapFrame.messageId < passFrame.messageId && passFrame.messageId < failFrame.messageId,
      'messageIds are fresh and strictly increasing',
    );
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 3 — an app that dies mid-flight yields typed failures, and a relaunch
 * supersedes it.
 *
 * The gateway socket dying with an invoke in flight rejects that invoke with
 * the typed app-death error; the handle is dead from then on (fast typed
 * failures, no hanging); the DEVICE handle is untouched. Relaunching the
 * same bundle id must cope with the previous OS process still running —
 * `simctl launch` over a live instance HANGS, so the server terminates before
 * launching, v20 parity — and hands back a fresh working handle while the
 * old one stays dead.
 */
test('an app that dies mid-flight yields typed failures, and relaunch supersedes it', async (t) => {
  const probe = await createSimulatorExternally('detox-spec003-death', t.signal);
  const bundleId = 'com.detox.spec003.doomed';
  try {
    await using server = await startServer({ signal: t.signal });
    await using detox = await connect({ server: server.address, signal: t.signal });
    await using device = appsOf(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } }),
    );
    const appPath = await buildStubAppExternally(bundleId, t.signal);
    await device.installApp(appPath);

    const launching = device.launchApp(bundleId, { signal: t.signal });
    await using fake = await impersonateLaunchedApp(probe.udid, bundleId, { signal: t.signal });
    await fake.handshake();
    const app = await launching;

    const tapping = app.element(app.by.text('tapMe')).tap();
    await fake.nextMessage((message) => message.type === 'invoke');
    fake.close();

    const inFlight = assertDetoxError(
      await rejectionOf(tapping, 'invoke in flight when the app died'),
      'invoke in flight when the app died',
    );
    assert.equal(inFlight.code, APP_GATEWAY_CODES.DETOX_APP_DIED);

    const deadTap = app.element(app.by.text('tapMe')).tap();
    const afterDeath = assertDetoxError(
      await rejectionOf(deadTap, 'invoke on a dead handle'),
      'invoke on a dead handle',
    );
    assert.equal(afterDeath.code, APP_GATEWAY_CODES.DETOX_APP_DIED, 'the handle stays dead');
    assert.equal(device.state, 'booted', 'the DEVICE handle is untouched by app death');

    const relaunching = device.launchApp(bundleId, { signal: t.signal });
    await using successor = await impersonateLaunchedApp(probe.udid, bundleId, {
      signal: t.signal,
      excludePid: fake.process.pid,
    });
    await successor.handshake();
    const relaunched = await relaunching;
    assert.notEqual(successor.process.pid, fake.process.pid, 'relaunch is a fresh OS process');

    const retap = relaunched.element(relaunched.by.text('tapMe')).tap();
    const frame = await successor.nextMessage((message) => message.type === 'invoke');
    assert.deepEqual(frame.params, TAP_INVOCATION);
    successor.send({ type: 'invokeResult', messageId: frame.messageId, params: {} });
    await retap;

    const zombieTap = app.element(app.by.text('tapMe')).tap();
    const oldStillDead = assertDetoxError(
      await rejectionOf(zombieTap, 'old handle after relaunch'),
      'old handle after relaunch',
    );
    assert.equal(oldStillDead.code, APP_GATEWAY_CODES.DETOX_APP_DIED);
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 4 — two apps live on one device at once; terminate kills exactly one
 * handle. This is where v21 beats Detox 20's `selectApp` global-switch
 * model: both apps hold live gateway sessions SIMULTANEOUSLY, traffic routes
 * by handle with zero cross-talk, a matcher is stateless data usable across
 * handles, and `terminate` kills the OS process, closes that app's gateway
 * session (the app process's own socket death and the server's active close
 * may race — "closed" is the pin, not who closed first), and invalidates
 * that handle alone.
 */
test('two apps live on one device at once; terminate kills exactly one handle', async (t) => {
  const probe = await createSimulatorExternally('detox-spec003-duo', t.signal);
  const alphaId = 'com.detox.spec003.alpha';
  const betaId = 'com.detox.spec003.beta';
  try {
    await using server = await startServer({ signal: t.signal });
    await using detox = await connect({ server: server.address, signal: t.signal });
    await using device = appsOf(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } }),
    );
    const alphaPath = await buildStubAppExternally(alphaId, t.signal);
    await device.installApp(alphaPath);
    const betaPath = await buildStubAppExternally(betaId, t.signal);
    await device.installApp(betaPath);

    const launchingAlpha = device.launchApp(alphaId, { signal: t.signal });
    await using fakeAlpha = await impersonateLaunchedApp(probe.udid, alphaId, { signal: t.signal });
    await fakeAlpha.handshake();
    const alpha = await launchingAlpha;

    const launchingBeta = device.launchApp(betaId, { signal: t.signal });
    await using fakeBeta = await impersonateLaunchedApp(probe.udid, betaId, { signal: t.signal });
    await fakeBeta.handshake();
    const beta = await launchingBeta;

    const alphaTap = alpha.element(alpha.by.text('tapMe')).tap();
    const alphaFrame = await fakeAlpha.nextMessage((message) => message.type === 'invoke');
    assert.deepEqual(alphaFrame.params, TAP_INVOCATION);
    fakeAlpha.send({ type: 'invokeResult', messageId: alphaFrame.messageId, params: {} });
    await alphaTap;
    assert.ok(
      !fakeBeta.received.some((message) => message.type === 'invoke'),
      'no cross-talk: alpha traffic never reaches beta',
    );

    // A matcher is pure predicate data — built by one app's `by`, legal for
    // another app's `element`, identical on the wire.
    const crossTap = beta.element(alpha.by.text('tapMe')).tap();
    const crossFrame = await fakeBeta.nextMessage((message) => message.type === 'invoke');
    assert.deepEqual(crossFrame.params, TAP_INVOCATION, 'by is stateless across handles');
    fakeBeta.send({ type: 'invokeResult', messageId: crossFrame.messageId, params: {} });
    await crossTap;

    await alpha.terminate();
    await fakeAlpha.closed;
    await waitForAppProcessExit(probe.udid, fakeAlpha.process.pid, t.signal);

    const deadAlphaTap = alpha.element(alpha.by.text('tapMe')).tap();
    const deadAlpha = assertDetoxError(
      await rejectionOf(deadAlphaTap, 'terminated handle'),
      'terminated handle',
    );
    assert.equal(deadAlpha.code, APP_GATEWAY_CODES.DETOX_APP_DIED);

    const betaTap = beta.element(beta.by.text('tapMe')).tap();
    const betaFrame = await fakeBeta.nextMessage((message) => message.type === 'invoke');
    fakeBeta.send({ type: 'invokeResult', messageId: betaFrame.messageId, params: {} });
    await betaTap;
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 5 — abort abandons the in-flight invoke; the frozen dialect carries
 * NO cancellation.
 *
 * The frozen native dialect cannot cancel an in-flight invoke — it can only
 * be abandoned. Aborting a tap rejects it promptly
 * with the uniform typed abort; the gateway sends the app NOTHING because of
 * the abort (any invented "cancel" frame would fatalError a real app — the
 * fake enforces the closed type set); a LATE reply to the abandoned id is
 * dropped harmlessly; and the handle survives — the next invoke works and
 * never reuses the abandoned id.
 */
test('abort abandons the in-flight invoke: no wire cancellation, late replies are dropped', async (t) => {
  const probe = await createSimulatorExternally('detox-spec003-abandon', t.signal);
  const bundleId = 'com.detox.spec003.patient';
  try {
    await using server = await startServer({ signal: t.signal });
    await using detox = await connect({ server: server.address, signal: t.signal });
    await using device = appsOf(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } }),
    );
    const appPath = await buildStubAppExternally(bundleId, t.signal);
    await device.installApp(appPath);

    const launching = device.launchApp(bundleId, { signal: t.signal });
    await using fake = await impersonateLaunchedApp(probe.udid, bundleId, { signal: t.signal });
    await fake.handshake();
    const app = await launching;

    const aborter = new AbortController();
    const tapping = app.element(app.by.text('tapMe')).tap({ signal: aborter.signal });
    const abandoned = await fake.nextMessage((message) => message.type === 'invoke');
    assert.deepEqual(abandoned.params, TAP_INVOCATION);

    aborter.abort(new Error('spec003: stopped waiting'));
    const err = assertDetoxError(await rejectionOf(tapping, 'aborted tap'), 'aborted tap');
    assert.equal(err.code, DetoxErrorCode.DETOX_ABORTED);
    const framesAfterAbort = fake.received.length;

    // The app answers LATE — after the caller already gave up. Nothing may
    // crash, and the correlation space must not be poisoned.
    fake.send({ type: 'invokeResult', messageId: abandoned.messageId, params: {} });

    const retap = app.element(app.by.text('tapMe')).tap();
    const fresh = await fake.nextMessage((message) => message.type === 'invoke');
    assert.notEqual(fresh.messageId, abandoned.messageId, 'abandoned ids are never reused');
    assert.ok(fresh.messageId > abandoned.messageId, 'ids keep increasing past an abandonment');
    fake.send({ type: 'invokeResult', messageId: fresh.messageId, params: {} });
    await retap;

    assert.equal(
      fake.received.length,
      framesAfterAbort + 1,
      'between abort and the next call, the gateway sent the app exactly the one fresh invoke — no cancellation frames exist in the frozen dialect',
    );
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 6 — the REAL instrumented app passes the sanity trio.
 *
 * A real app fixture simplifies everything once real interactions begin — so
 * this test drops the fake entirely. The server launches a minimal REAL UIKit
 * app with REAL Detox instrumentation injected at launch (the frozen v20
 * convention: `DYLD_INSERT_LIBRARIES` via the framework cache), and the whole
 * handshake and element channel run against the frozen NATIVE side itself.
 * The tap physically lands: the "Hello!!!" label is hidden until the
 * button's handler runs, so the passing expectation PROVES the tap.
 *
 * Suite precondition (loud, never skipped): the Detox framework cache —
 * `detox build-framework-cache` in the Detox 20 checkout, once per
 * Xcode/Detox version. The helper's error says exactly that.
 */
test('the real instrumented app passes the sanity trio: tap, visible, not visible', async (t) => {
  const probe = await createSimulatorExternally('detox-spec003-sanity', t.signal);
  const bundleId = 'com.detox.spec003.sanity';
  try {
    const frameworkPath = await resolveDetoxFrameworkExternally(t.signal);
    await using server = await startServer({
      dedicated: true,
      iosDetoxFrameworkPath: frameworkPath,
      signal: t.signal,
    });
    await using detox = await connect({ server: server.address, signal: t.signal });
    await using device = appsOf(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } }),
    );
    const appPath = await buildHelloAppExternally(bundleId, t.signal);
    await device.installApp(appPath);

    const app = await device.launchApp(bundleId, { signal: t.signal });
    assert.equal(app.bundleId, bundleId);
    assert.ok(app.pid > 0, 'the handle names a real OS process');
    const { by, element, expect: expectElement } = app;

    await element(by.text('Say Hello')).tap();
    await expectElement(element(by.text('Hello!!!'))).toBeVisible();

    const failing = expectElement(element(by.text('Nonexistent'))).toBeVisible();
    const err = assertDetoxError(
      await rejectionOf(failing, 'expectation the real app rejects'),
      'expectation the real app rejects',
    );
    assert.equal(err.code, APP_GATEWAY_CODES.DETOX_EXPECTATION_FAILED);
    assert.ok(
      err.details !== undefined && Object.keys(err.details).length > 0,
      "the real app's own failure payload (view hierarchy et al.) must survive into the typed error",
    );
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 7 — `installApp` accepts an http(s) URL naming an app ARCHIVE.
 *
 * Added after the original six: the spec first shipped the interim
 * server-read PATH transport and reserved the remote lane for later; running
 * the suite on a second machine made the lane real. A URL, unlike a path,
 * means the same thing from every machine — the server dereferencing it
 * grants the caller no authority it did not already have, so this form is not
 * bound to the loopback refusal that guards the path form.
 *
 * What is pinned: the server downloads the archive from the URL, unpacks
 * it, and REALLY installs the bundle — proven the same way test 1 proves
 * installs, by launching the app and completing the ready handshake.
 * Archive selection rides the URL's own extension (`.zip` here; the
 * tarball family is unit-gated). Caching, credentials, and integrity
 * pinning are deliberately unspecified — the future transfer-lane spec
 * owns them.
 */
test('installApp accepts a URL: the zipped app is fetched, unpacked and really installed', async (t) => {
  const probe = await createSimulatorExternally('detox-spec003-urlinstall', t.signal);
  const bundleId = 'com.detox.spec003.urlinstall';
  try {
    await using server = await startServer({ signal: t.signal });
    await using detox = await connect({ server: server.address, signal: t.signal });
    await using device = appsOf(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } }),
    );
    const appPath = await buildStubAppExternally(bundleId, t.signal);
    await using archive = await serveZippedAppExternally(appPath, t.signal);
    assert.ok(archive.url.endsWith('.zip'), 'the fixture link carries the archive extension');
    await device.installApp(archive.url);

    const launching = device.launchApp(bundleId, { signal: t.signal });
    await using fake = await impersonateLaunchedApp(probe.udid, bundleId, { signal: t.signal });
    await fake.handshake();
    const app = await launching;
    assert.equal(app.bundleId, bundleId, 'the URL-installed app really launched');
    assert.equal(app.pid, fake.process.pid, 'the handle names the real OS process');
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});
