/**
 * Acceptance: spec 015 — drivers.
 *
 * This file is frozen and append-only. It speaks only the public dialect
 * (`detox/client`), the editable helpers, and the typed door `appsOf015` /
 * `allocateAnyOf` (`./helpers/typed-door.ts`), written before `device.apps`
 * was public and now collapsed onto the real types.
 *
 * Style is part of the contract: straight-line awaits, no function
 * definitions in this file (inline predicates over helper results are the
 * 006 precedent). Three tests, each guarding one claim the other two cannot
 * see: an app launched outside Detox is attachable and attach never spawns
 * (1); the same bundle id on two devices stays two apps (2); a driver is an
 * npm package the server imports by name, a path is never imported on
 * request, an opaque session id is matched not parsed, logins that precede
 * any waiter land on their own device, and an absent capability is a typed
 * refusal (3). Process identity is proven through `ps` (`discoverDetoxApps`),
 * never through a handle field: the frozen dialect carries no pid, so an
 * attached handle has none. The rule for this spec: lean here, nitpicking
 * in unit and integration tests.
 *
 * Simulator policy: tests 1 and 2 create their probe simulators and delete
 * them in `finally` (test 2 is the suite's heaviest: two cold boots and two
 * first launches, so a red there is load-suspect); test 3 needs no simulator
 * at all.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { connect, DetoxErrorCode } from 'detox/client';

import { startServer } from './helpers/server';
import {
  buildHelloAppExternally,
  launchInstrumentedAppExternally,
  resolveDetoxFrameworkExternally,
} from './helpers/real-app';
import { connectFakeApp, discoverDetoxApps } from './helpers/fake-app';
import { assertDetoxError, rejectionOf } from './helpers/errors';
import { allocateAnyOf, appsOf015 } from './helpers/typed-door';
import { createSimulatorExternally, deleteSimulatorExternally, shutdownSimulatorExternally } from './helpers/simctl';

/** The fake driver (spec 015, Fixture policy): a workspace package, imported by the server by name like any driver. */
const FAKE_DRIVER = 'spec015-fake-driver';
/** A cold first launch of the real app can take minutes on a loaded machine; a wedge must still end typed. */
const OUTSIDE_LAUNCH_WAIT_MS = 180_000;

/**
 * Test 1 — an app launched outside Detox is attachable; launch replaces it.
 *
 * `attach` is called before anything runs, so resolving proves a waiter,
 * not a lookup. The launch is the test's own `simctl launch` with the
 * framework injected and ONLY `-detoxServer` — no session id — so what logs
 * in is the frozen native's default, the bundle id. `ps` shows the process
 * simctl printed, carrying no `-detoxSessionId`: the server's own launches
 * always pass one, so this pins that `attach` never spawned anything. A tap
 * physically lands; a second attach and an `activate` leave that one
 * process alone (no relaunch); `launch` then replaces it.
 */
void test('an app launched outside Detox is attachable, and launch replaces it', async (t) => {
  const probe = await createSimulatorExternally('detox-spec015-outside', t.signal);
  const bundleId = 'com.detox.spec015.outside';
  try {
    const framework = await resolveDetoxFrameworkExternally(t.signal);
    await using server = await startServer({ dedicated: true, iosDetoxFrameworkPath: framework, signal: t.signal });
    await using detox = await connect({ server: server.address, signal: t.signal });
    await using device = appsOf015(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } }),
    );
    await device.installApp(await buildHelloAppExternally(bundleId, t.signal));

    const attaching = device.apps.attach(bundleId, {
      signal: AbortSignal.any([t.signal, AbortSignal.timeout(OUTSIDE_LAUNCH_WAIT_MS)]),
    });
    const pid = await launchInstrumentedAppExternally(probe.udid, bundleId, {
      serverUrl: device.apps.serverUrl,
      frameworkPath: framework,
      signal: t.signal,
    });
    const app = await attaching;
    assert.equal(app.bundleId, bundleId, 'no -detoxSessionId was passed: the native default, the bundle id, logged in');
    const outside = (await discoverDetoxApps(probe.udid, t.signal)).find((candidate) => candidate.pid === pid);
    assert.ok(outside, 'the outside-launched process is on this simulator, argv readable');
    assert.equal(
      outside.detoxSessionId,
      undefined,
      'that process carries no -detoxSessionId: the server did not launch it — attach never spawns',
    );

    await app.element(app.by.text('Say Hello')).tap();
    await app.expect(app.element(app.by.text('Hello!!!'))).toBeVisible();

    await device.apps.attach(bundleId, { signal: t.signal });
    await device.apps.activate(bundleId, { signal: t.signal });
    const stillOne = (await discoverDetoxApps(probe.udid, t.signal)).filter((candidate) => candidate.command.includes(bundleId));
    assert.deepEqual(
      stillOne.map((candidate) => candidate.pid),
      [pid],
      'a second attach and an activate on a connected app relaunch nothing: the one outside process is still the only one',
    );

    const fresh = await device.apps.launch(bundleId, { signal: t.signal });
    assert.notEqual(fresh.pid, pid, 'launch is always a new instance');
    const superseded = assertDetoxError(
      await rejectionOf(app.element(app.by.text('Say Hello')).tap(), 'the attached handle after launch'),
      'the attached handle after launch',
    );
    assert.equal(superseded.code, DetoxErrorCode.DETOX_APP_DIED, 'the replaced instance\'s handle is dead');
    await fresh.expect(fresh.element(fresh.by.text('Say Hello'))).toBeVisible();
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 2 — the same bundle id on two devices stays two apps.
 *
 * One launched through the product, one attached after an outside launch.
 * Each handle reads its own device's udid from the app's label through the
 * public dialect. Then the first device is released and allocated again:
 * release is a ledger entry, so the listener and the session live with the
 * BOOTED DEVICE — the next owner attaches at once, `ps` shows the launched
 * process still alive and alone under that bundle id, the previous owner's
 * handle is stale, and the other device's handle is untouched throughout.
 * The real-app half of the per-device claim; test 3 carries the
 * login-before-any-waiter half without simulators.
 */
void test('the same bundle id on two devices stays two apps', async (t) => {
  const alphaProbe = await createSimulatorExternally('detox-spec015-alpha', t.signal);
  const betaProbe = await createSimulatorExternally('detox-spec015-beta', t.signal);
  const bundleId = 'com.detox.spec015.twins';
  try {
    const framework = await resolveDetoxFrameworkExternally(t.signal);
    await using server = await startServer({ dedicated: true, iosDetoxFrameworkPath: framework, signal: t.signal });
    await using detox = await connect({ server: server.address, signal: t.signal });
    const appPath = await buildHelloAppExternally(bundleId, t.signal);
    const alpha = appsOf015(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: alphaProbe.udid } }),
    );
    await using beta = appsOf015(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: betaProbe.udid } }),
    );
    await alpha.installApp(appPath);
    await beta.installApp(appPath);

    const a = await alpha.apps.launch(bundleId, { signal: t.signal });
    const attaching = beta.apps.attach(bundleId, {
      signal: AbortSignal.any([t.signal, AbortSignal.timeout(OUTSIDE_LAUNCH_WAIT_MS)]),
    });
    await launchInstrumentedAppExternally(betaProbe.udid, bundleId, {
      serverUrl: beta.apps.serverUrl,
      frameworkPath: framework,
      signal: t.signal,
    });
    const b = await attaching;

    await a.expect(a.element(a.by.text(alphaProbe.udid))).toBeVisible();
    await b.expect(b.element(b.by.text(betaProbe.udid))).toBeVisible();

    await alpha.release({ signal: t.signal });
    // Release is a ledger entry: the device keeps its listener, the app keeps running,
    // and the next owner of the same device finds it — while the previous owner's handle is stale.
    // The re-allocated handle is never released on purpose: the `finally` deletes the simulator.
    const alphaAgain = appsOf015(
      await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: alphaProbe.udid } }),
    );
    const survivor = await alphaAgain.apps.attach(bundleId, { signal: t.signal });
    await survivor.expect(survivor.element(survivor.by.text(alphaProbe.udid))).toBeVisible();
    const alphaProcesses = (await discoverDetoxApps(alphaProbe.udid, t.signal)).filter((candidate) => candidate.command.includes(bundleId));
    assert.deepEqual(
      alphaProcesses.map((candidate) => candidate.pid),
      [a.pid],
      'the process the previous allocation launched is still the only one: attach found it, nothing was spawned',
    );
    const stale = assertDetoxError(
      await rejectionOf(a.element(a.by.text('Say Hello')).tap(), 'the previous owner\'s handle after release'),
      'the previous owner\'s handle after release',
    );
    assert.equal(stale.code, DetoxErrorCode.DETOX_STALE_HANDLE, 'the previous owner cannot drive it');
    await b.expect(b.element(b.by.text('Say Hello'))).toBeVisible();
  } finally {
    await shutdownSimulatorExternally(alphaProbe.udid).catch(() => undefined);
    await deleteSimulatorExternally(alphaProbe.udid).catch(() => undefined);
    await shutdownSimulatorExternally(betaProbe.udid).catch(() => undefined);
    await deleteSimulatorExternally(betaProbe.udid).catch(() => undefined);
  }
});

/**
 * Test 3 — a driver is an npm package the server imports, and the seam is
 * honest. No simulator anywhere, nothing special on the server's command
 * line: `device.type` names the fake driver's workspace package and the
 * server imports it like any driver. A package that does not exist and a
 * path-shaped type are both refused typed — a file is never imported on
 * request. Two fake devices; two fake testees log in under the SAME opaque
 * session id, each to its own device's listener, BEFORE any waiter exists
 * — then attach on each device hands back the app on that device, and a
 * tap reaches only its own testee (a shared listener could not tell them
 * apart: nothing was waiting when they arrived). The core matches the
 * string exactly and never parses it; an absent capability is a typed
 * refusal, never a no-op.
 */
void test('a driver is an npm package the server imports, and the seam is honest', async (t) => {
  await using server = await startServer({ dedicated: true, signal: t.signal });
  await using detox = await connect({ server: server.address, signal: t.signal });
  const allocator = allocateAnyOf(detox);

  const unknown = assertDetoxError(
    await rejectionOf(allocator.allocateDevice({ type: 'no-such-driver-package', signal: t.signal }), 'a package that does not exist'),
    'a package that does not exist',
  );
  assert.equal(unknown.code, DetoxErrorCode.DETOX_NO_MATCHING_DEVICE, 'nothing to import, no device — what frozen 002 pins for an unmatched type');
  const pathShaped = assertDetoxError(
    await rejectionOf(allocator.allocateDevice({ type: './specs/fake-driver', signal: t.signal }), 'a path-shaped type'),
    'a path-shaped type',
  );
  assert.equal(pathShaped.code, DetoxErrorCode.DETOX_NO_MATCHING_DEVICE, 'a file is never imported on request');

  await using one = appsOf015(await allocator.allocateDevice({ type: FAKE_DRIVER, signal: t.signal }));
  await using two = appsOf015(await allocator.allocateDevice({ type: FAKE_DRIVER, signal: t.signal }));

  const sessionId = 'com.example:user10';
  await using testeeOne = await connectFakeApp({ url: one.apps.serverUrl, sessionId, signal: t.signal });
  await testeeOne.handshake();
  await using testeeTwo = await connectFakeApp({ url: two.apps.serverUrl, sessionId, signal: t.signal });
  await testeeTwo.handshake();

  const attachSignal = AbortSignal.any([t.signal, AbortSignal.timeout(30_000)]);
  const appOne = await one.apps.attach(sessionId, { signal: attachSignal });
  const appTwo = await two.apps.attach(sessionId, { signal: attachSignal });

  const tapOne = appOne.element(appOne.by.text('tapMe')).tap();
  const frameOne = await testeeOne.nextMessage((message) => message.type === 'invoke');
  testeeOne.send({ type: 'invokeResult', messageId: frameOne.messageId, params: {} });
  await tapOne;
  const tapTwo = appTwo.element(appTwo.by.text('tapMe')).tap();
  const frameTwo = await testeeTwo.nextMessage((message) => message.type === 'invoke');
  testeeTwo.send({ type: 'invokeResult', messageId: frameTwo.messageId, params: {} });
  await tapTwo;
  assert.equal(
    testeeOne.received.filter((message) => message.type === 'invoke').length,
    1,
    'device one\'s app saw exactly its own tap: the two logins landed on their own devices',
  );

  const connected = await one.apps.connected({ signal: t.signal });
  assert.equal(connected.length, 1, 'exactly the one live session on device one');

  const bare = assertDetoxError(
    await rejectionOf(one.apps.attach('com.example', { signal: AbortSignal.timeout(1_000) }), 'attach by the bare bundle id'),
    'attach by the bare bundle id',
  );
  assert.equal(bare.code, DetoxErrorCode.DETOX_ABORTED, 'nothing is connected under the bare id: exact match, no parsing');

  const missing = assertDetoxError(
    await rejectionOf(one.setLocation(1, 2, { signal: t.signal }), 'setLocation on a driver without it'),
    'setLocation on a driver without it',
  );
  assert.equal(missing.code, DetoxErrorCode.DETOX_NOT_IMPLEMENTED, 'an absent capability refuses typed');
});
