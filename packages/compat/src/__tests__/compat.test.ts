/**
 * The compat surface, driven over the same fake transport the
 * client's own session tests use: a real `Peer` on a fake WebSocket, so what
 * is asserted is the wire the v21 server would actually see.
 *
 * The module under test is a singleton, so every test tears it down
 * through `cleanup()` — order inside a test matters, and tests never share
 * an initialized surface.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { DetoxError, DetoxErrorCode, type DetoxOperationRef } from 'detox/client';

import {
  by,
  cleanup,
  device,
  element,
  expect as expectElement,
  init,
  session,
  waitFor,
  type CompatConfig,
} from '../index';
import {
  FakeWebSocket,
  connectFakeServer,
  type FakeServer,
} from '../../../../detox/src/client/__tests__/helpers/fake-transport';
import {
  startBlobLaneStub,
  type BlobLaneStub,
} from '../../../../detox/src/client/__tests__/helpers/blob-lane-stub';
import {
  makeAppBundleFixture,
  type AppBundleFixture,
} from '../../../../detox/src/client/__tests__/helpers/app-bundle-fixture';

vi.mock('ws', async () => {
  const { FakeWebSocket: FakeWebSocketCtor } = await import(
    '../../../../detox/src/client/__tests__/helpers/fake-transport'
  );
  return { default: FakeWebSocketCtor };
});

const allocation = {
  allocationId: 'alloc-1',
  device: { udid: 'udid-1' },
  name: 'iPhone 17',
  os: 'iOS 26.5',
  state: 'booted',
  apps: { serverUrl: 'ws://127.0.0.1:8099' },
};

interface Received {
  method: string;
  params: Record<string, unknown>;
}

// The ws transport is faked, but installApp's upload lane (spec 007) is real
// HTTP against `blobLane`'s loopback stub — so configured binaries must be
// real on-disk .app directories, and the session must be initialized with the
// stub's real address (the fake WebSocket ignores it; `BlobLaneClient` dials
// it). Both are minted once for the whole file in `beforeAll`.
let blobLane: BlobLaneStub;
let exampleBundle: AppBundleFixture;
let anotherBundle: AppBundleFixture;
const EXAMPLE_APP = {
  name: 'example',
  bundleId: 'com.wix.detox-example',
  binaryPath: '', // assigned in beforeAll, once the fixture bundle exists
};
const OTHER_APP = { name: 'other', bundleId: 'com.wix.other' };

/** The wire shape of the blob param, for reading it back off `received`. */
interface WireBlobRef {
  algo: string;
  hex: string;
}

/** The wire shape of an install that went through the blob lane. */
const BLOB_PARAMS = {
  allocationId: 'alloc-1',
  blob: { algo: 'sha256', hex: expect.stringMatching(/^[0-9a-f]{64}$/) as unknown as string },
};

beforeAll(async () => {
  blobLane = await startBlobLaneStub();
  exampleBundle = await makeAppBundleFixture('Example');
  anotherBundle = await makeAppBundleFixture('Another');
  EXAMPLE_APP.binaryPath = exampleBundle.appPath;
});

afterAll(async () => {
  await blobLane.close();
  await exampleBundle.dispose();
  await anotherBundle.dispose();
});

interface Fixture {
  received: Received[];
  server: FakeServer;
}

async function initCompat(overrides: Partial<CompatConfig> = {}): Promise<Fixture> {
  const initPromise = init({
    server: { url: blobLane.url },
    apps: [EXAMPLE_APP],
    ...overrides,
  });
  const server = connectFakeServer();
  const received: Received[] = [];
  let launches = 0;
  server.onRequest('allocateDevice', async () => allocation);
  server.onRequest('releaseDevice', async () => ({ released: true }));
  server.onRequest<Record<string, unknown>, { pid: number; appHandleId: string }>(
    'launchApp',
    async (params) => {
      received.push({ method: 'launchApp', params });
      launches += 1;
      return { pid: 4000 + launches, appHandleId: `handle-${String(launches)}` };
    },
  );
  for (const method of [
    'installApp',
    'terminateApp',
    'reloadReactNative',
    'openURL',
    'setLocation',
    'setStatusBar',
    'resetStatusBar',
    'setBiometricEnrollment',
    'matchFace',
    'unmatchFace',
    'matchFinger',
    'unmatchFinger',
    'clearKeychain',
    'resetContentAndSettings',
    'uninstallApp',
    // Spec 006's verbs — the compat mapping's whole point.
    'setPermissions',
    'sendToHome',
    'foregroundApp',
    'waitForActive',
    'waitForBackground',
    'deliverPayload',
    'setSyncSettings',
  ]) {
    server.onRequest<Record<string, unknown>, null>(method, async (params) => {
      received.push({ method, params });
      return null;
    });
  }
  server.onRequest<Record<string, unknown>, { result?: unknown }>('invoke', async (params) => {
    received.push({ method: 'invoke', params });
    return {};
  });
  await initPromise;
  return { received, server };
}

beforeEach(() => {
  FakeWebSocket.created.length = 0;
});

afterEach(async () => {
  await cleanup();
});

describe('init and the device identity surface', () => {
  /**
   * @issue DTX-4003
   * v20's `reinstallApp` is uninstall then install (`DetoxWorker.js:292-300`): app data and
   * granted permissions must not carry across runs. A configured binary reinstalls through the
   * blob lane (spec 007) — a content hash on the wire, never a filesystem path.
   * @issue DTX-4015
   * `device.os` is not a v20 property: v20's own `deviceInfo.js` util reached for the same fact
   * through `device._device.deviceConfig.device.os`, a path that never resolved, so a hardcoded
   * `18` always won. This getter is the accessor the ported util reads.
   */
  it('connects, allocates, REinstalls configured binaries, and auto-selects a single app', async () => {
    const { received } = await initCompat();
    expect(received).toEqual([
      {
        method: 'uninstallApp',
        params: { allocationId: 'alloc-1', appId: 'com.wix.detox-example' },
      },
      { method: 'installApp', params: BLOB_PARAMS },
    ]);
    expect(device.getPlatform()).toBe('ios');
    expect(device.id).toBe('udid-1');
    expect(device.name).toBe('iPhone 17');
    expect(device.os).toBe('iOS 26.5');
    // The single app is pre-selected: launchApp works with no selectApp call.
    await device.launchApp();
    expect(received.at(-1)).toMatchObject({
      method: 'launchApp',
      params: { allocationId: 'alloc-1', appId: 'com.wix.detox-example' },
    });
  });

  it('refuses a second init while initialized, and cleanup is idempotent', async () => {
    await initCompat();
    await expect(init({ server: { url: 'ws://x' }, apps: [] })).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
    });
    await cleanup();
    await cleanup(); // second cleanup is a no-op, never a throw
    expect(() => device.id).toThrowError(
      expect.objectContaining({ code: DetoxErrorCode.DETOX_NOT_INITIALIZED }) as Error,
    );
  });

  /**
   * @issue DTX-4001
   * The in-flight promise is part of the guard: two overlapping `init()` calls would otherwise
   * both pass a `state`-only check and leak the loser's session and device.
   */
  it('refuses an OVERLAPPING init — the in-flight promise is part of the guard', async () => {
    const first = init({ server: { url: 'ws://fake-host/detox' }, apps: [] });
    const second = init({ server: { url: 'ws://fake-host/detox' }, apps: [] });
    await expect(second).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
    });
    const server = connectFakeServer();
    server.onRequest('allocateDevice', async () => allocation);
    server.onRequest('releaseDevice', async () => ({ released: true }));
    await first; // the winner completes untouched
    expect(device.name).toBe('iPhone 17');
  });

  /**
   * @issue DTX-4005
   * A cleanup racing an in-flight init waits it out, then tears down what the init installed —
   * never a silent no-op that leaves the surface live.
   */
  it('a cleanup racing a FAILING init waits it out and finds nothing to clean', async () => {
    const failing = init({ server: { url: 'ws://fake-host/detox' }, apps: [] });
    const cleaning = cleanup();
    const server = connectFakeServer();
    server.onRequest('allocateDevice', async () => {
      throw new Error('nothing for you');
    });
    await expect(failing).rejects.toBeTruthy();
    await cleaning; // resolves: the failed init installed nothing to tear down
    expect(() => device.name).toThrowError(
      expect.objectContaining({ code: DetoxErrorCode.DETOX_NOT_INITIALIZED }) as Error,
    );
  });

  /**
   * @issue DTX-4002
   * v20's own example config gives two aliases one `name:` field; transcribed into this flat
   * list the first would silently win, so `connect` refuses the collision instead.
   */
  it('refuses duplicate app names in the config — the v20 example-config transcription hazard', async () => {
    await expect(
      init({
        server: { url: 'ws://x' },
        apps: [
          { name: 'example', bundleId: 'com.a' },
          { name: 'example', bundleId: 'com.b' },
        ],
      }),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    // The refusal happened before any connection was opened.
    expect(FakeWebSocket.created.length).toBe(0);
  });

  it('an init that fails after connecting tears its session down', async () => {
    const initPromise = init({ server: { url: 'ws://fake-host/detox' }, apps: [] });
    const server = connectFakeServer();
    server.onRequest('allocateDevice', async () => {
      throw new Error('nothing for you');
    });
    await expect(initPromise).rejects.toBeTruthy();
    // The socket the failed init opened is closed, not leaked.
    expect(FakeWebSocket.created.at(-1)?.readyState).toBe(3);
    // And the surface stays uninitialized.
    expect(() => device.name).toThrowError(
      expect.objectContaining({ code: DetoxErrorCode.DETOX_NOT_INITIALIZED }) as Error,
    );
  });

  it('before init, every stateful entry refuses with DETOX_NOT_INITIALIZED', async () => {
    const matcher = by.text('anything'); // stateless — legal before init
    expect(matcher).toBeTruthy();
    // Building an element is legal before init — v20 builds matcher data and
    // nothing else, and suites do it at describe time. The ACTION is what
    // needs a launched app.
    await expect(element(matcher).tap()).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NOT_INITIALIZED,
    });
    await expect(device.selectApp('example')).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NOT_INITIALIZED,
    });
    await expect(device.launchApp()).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NOT_INITIALIZED,
    });
  });
});

describe('selectApp and the current-app bookkeeping', () => {
  /**
   * @issue DTX-4016
   * Faithful to v20 (`RuntimeDevice.js:93-110`): `selectApp` matches the config's `name:` field
   * (not either alias), terminates the outgoing app before the switch — including on the `null`
   * internal deselect — and refuses `undefined` (v20's `cantSelectEmptyApp`: a JS
   * fixture can pass it despite the TS signature, and v20 makes that a loud error, not a deselect).
   */
  it('matches the name: field, terminates the outgoing app on switch (v20), and null deselects', async () => {
    const { received } = await initCompat({ apps: [EXAMPLE_APP, OTHER_APP] });

    // Two apps: nothing is auto-selected, launchApp refuses until selectApp.
    await expect(device.launchApp()).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NOT_INITIALIZED,
    });

    await device.selectApp('example');
    await device.launchApp(); // handle-1
    await element(by.text('Tap me')).tap();
    expect(received.at(-1)).toMatchObject({
      method: 'invoke',
      params: { appHandleId: 'handle-1' },
    });

    // Switching apps terminates the outgoing one first, so the fresh selection
    // has no running app until it is launched.
    await device.selectApp('other');
    expect(received.at(-1)).toMatchObject({
      method: 'terminateApp',
      params: { appHandleId: 'handle-1' },
    });
    await expect(element(by.text('x')).tap()).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NOT_INITIALIZED,
    });
    await device.launchApp(); // handle-2
    await expectElement(element(by.id('welcome'))).toBeVisible();
    expect(received.at(-1)).toMatchObject({
      method: 'invoke',
      params: { appHandleId: 'handle-2' },
    });
    expect(received.filter((r) => r.method === 'launchApp').map((r) => r.params.appId)).toEqual([
      'com.wix.detox-example',
      'com.wix.other',
    ]);

    // waitFor rides the invoke lane with the timeout on the invocation,
    // addressed to the current app's handle.
    await waitFor(element(by.id('welcome'))).toBeVisible().withTimeout(100);
    expect(received.at(-1)).toMatchObject({
      method: 'invoke',
      params: {
        appHandleId: 'handle-2',
        invocation: { type: 'expectation', expectation: 'toBeVisible', timeout: 100 },
      },
    });

    // null deselects, terminating the current app first.
    await device.selectApp(null);
    expect(received.at(-1)).toMatchObject({
      method: 'terminateApp',
      params: { appHandleId: 'handle-2' },
    });
    await expect(element(by.text('x')).tap()).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NOT_INITIALIZED,
    });

    await expect(device.selectApp('missing')).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
    });
    await expect(device.selectApp(undefined as never)).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
    });
  });
});

describe('launchApp semantics (spec 006 compat mapping)', () => {
  /**
   * @issue DTX-4000
   * v20's default `newInstance` is "the app is not already running" — so a bare relaunch over a
   * live app is a resume, never a second launch.
   */
  it('fresh-launches, and a bare relaunch over a live app RESUMES — v20 default', async () => {
    const { received } = await initCompat();
    await device.launchApp(); // first bare launch: no running app, v20-identical
    expect(received.at(-1)?.method).toBe('launchApp');

    await device.launchApp();
    expect(received.at(-1)).toEqual({
      method: 'foregroundApp',
      params: { allocationId: 'alloc-1', appHandleId: 'handle-1' },
    });
    // Explicit newInstance:false is the same path spelled out.
    await device.launchApp({ newInstance: false });
    expect(received.at(-1)?.method).toBe('foregroundApp');
    // …and newInstance:true is a real second launch.
    await device.launchApp({ newInstance: true });
    expect(received.at(-1)?.method).toBe('launchApp');
  });

  /**
   * @issue DTX-4006
   * v20 stringified every non-primitive launch-arg value with `${v}`, never dropping it: an
   * object reaches the app as "[object Object]". Dropping it instead would be a
   * silently-swallowed option, even though the drop would look tidier.
   */
  it('maps launchArgs, languageAndLocale and the at-launch payload onto the fresh launch', async () => {
    const { received } = await initCompat();
    await device.launchApp({
      launchArgs: { detoxEnableSynchronization: 0, nested: { a: 1 } },
      languageAndLocale: { language: 'es-MX', locale: 'es-MX' },
      userNotification: { title: 'From push' },
    });
    expect(received.at(-1)).toMatchObject({
      method: 'launchApp',
      params: {
        appId: 'com.wix.detox-example',
        launchArgs: { detoxEnableSynchronization: 0, nested: '[object Object]' },
        languageAndLocale: { language: 'es-MX', locale: 'es-MX' },
        userNotification: { title: 'From push' },
      },
    });
  });

  /**
   * @issue DTX-4037
   * Kept verbatim from v20: a plain string passes through untouched (the legacy parenthesized
   * form still reaches the app as written), `g`/`y`/`d`/`u`/`v` flags are refused as
   * non-portable, and `i` becomes an inline `(?i:…)` group — the native side compiles the
   * pattern with ICU, which has no flags argument.
   */
  it('serializes detoxURLBlacklistRegex exactly as v20 did, and refuses non-portable flags', async () => {
    const { received } = await initCompat();
    await device.launchApp({
      launchArgs: { detoxURLBlacklistRegex: [/foo/i, '(bar)'] },
    });
    expect(received.at(-1)?.params).toMatchObject({
      launchArgs: { detoxURLBlacklistRegex: '["(?i:foo)","(bar)"]' },
    });
    await expect(
      device.launchApp({ newInstance: true, launchArgs: { detoxURLBlacklistRegex: /x/g } }),
    ).rejects.toThrowError(TypeError);
  });

  it('a payload handed to a RESUME rides deliverPayload with delayPayload, then foregrounds', async () => {
    const { received } = await initCompat();
    await device.launchApp();
    received.length = 0;
    await device.launchApp({ newInstance: false, userNotification: { title: 'From push' } });
    expect(received.map((r) => r.method)).toEqual(['deliverPayload', 'foregroundApp']);
    expect(received[0]?.params).toMatchObject({
      appHandleId: 'handle-1',
      userNotification: { title: 'From push' },
      delayPayload: true,
    });
  });

  /**
   * @issue DTX-4009
   * v20 discards `launchArgs`/`languageAndLocale` on a resume because no new process means no
   * new argv (spec 006). This surface is the only place such a discard is allowed.
   */
  it('a RESUME silently discards launchArgs and languageAndLocale — the one allowed silence', async () => {
    const { received } = await initCompat();
    await device.launchApp({ launchArgs: { first: 'launch' } });
    received.length = 0;
    await device.launchApp({
      newInstance: false,
      launchArgs: { second: 'ignored' },
      languageAndLocale: { language: 'es-MX' },
    });
    expect(received.map((r) => r.method)).toEqual(['foregroundApp']);
    expect(received[0]?.params).not.toHaveProperty('launchArgs');
    expect(received[0]?.params).not.toHaveProperty('languageAndLocale');
  });

  /**
   * @issue DTX-4010
   * `!== undefined`, not bare key presence: a migrating suite that spreads a config bag —
   * `{ resetAppState: opts.reset }` with `opts.reset` undefined — must launch, exactly as v20's
   * `if (params.resetAppState)` does.
   */
  it('an explicitly-undefined UNKNOWN option is not a refusal — v20 reads options by value', async () => {
    const { received } = await initCompat();
    received.length = 0;
    await device.launchApp({ resetAppState: undefined } as never);
    expect(received.map((r) => r.method)).toEqual(['launchApp']);
    // …while a real value is still the typed refusal.
    await expect(device.launchApp({ resetAppState: true } as never)).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED,
    });
  });

  /**
   * @issue DTX-4018
   * v20 `RuntimeDevice.js:188-190` guards on the value: a spread would put an explicit
   * `newInstance: undefined` back over the default and turn a relaunch into a resume.
   */
  it('relaunchApp keeps v20 default when newInstance is present-but-undefined', async () => {
    const { received } = await initCompat();
    await device.launchApp();
    received.length = 0;
    await device.relaunchApp({ newInstance: undefined });
    expect(received.map((r) => r.method)).toEqual(['launchApp']);
  });

  /**
   * @issue DTX-4012
   * `delete` composes terminate → uninstall → install (v20 lines 125-128); the terminate is not
   * redundant — an uninstall under a live app is what v20 guarded against.
   * @issue DTX-4013
   * Permissions are applied before the launch, through a device verb: the write
   * happens on the device, and its SpringBoard restart is why it is a device verb rather than a
   * launch option.
   */
  it('delete composes uninstall + install, and permissions precede the launch', async () => {
    const { received } = await initCompat();
    await device.launchApp();
    received.length = 0;
    await device.launchApp({ delete: true, permissions: { camera: 'YES' } });
    expect(received.map((r) => r.method)).toEqual([
      'terminateApp',
      'uninstallApp',
      'installApp',
      'setPermissions',
      'launchApp',
    ]);
    expect(received[3]?.params).toMatchObject({
      appId: 'com.wix.detox-example',
      permissions: { camera: 'YES' },
    });
  });

  /**
   * @issue DTX-4011
   * v20's `_assertHasSingleParam` counts truthiness, not presence — an explicitly-undefined
   * payload key is not a payload; `15.urls`' afterAll passes exactly this shape.
   */
  it('refuses more than one payload, and any option whose mechanism has no home yet', async () => {
    await initCompat();
    await expect(
      device.launchApp({ url: 'x://y', userActivity: { activityType: 'z' } }),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    await expect(device.launchApp({ resetAppState: true } as never)).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED,
      details: { options: ['resetAppState'] },
    });
    await device.launchApp({ url: undefined, launchArgs: undefined });
  });

  it('relaunchApp defaults newInstance to true (v20 sugar over terminate+launch)', async () => {
    const { received } = await initCompat();
    await device.launchApp();
    received.length = 0;
    await device.relaunchApp();
    expect(received.map((r) => r.method)).toEqual(['launchApp']);
  });

  /**
   * @issue DTX-4019
   * v20's `sendToHome` returned once the app was actually backgrounded; the v21 device verb
   * welds in no wait (spec 006 — a device with no instrumented app must still go home), so the
   * wait is composed on the compat surface, where a live handle is known.
   */
  it('sendToHome waits for the app to report itself backgrounded, when one is live', async () => {
    const { received } = await initCompat();
    received.length = 0; // drop init's own reinstall traffic
    await device.sendToHome(); // legal with no app: it is a DEVICE verb
    expect(received.map((r) => r.method)).toEqual(['sendToHome']);
    await device.launchApp();
    received.length = 0;
    await device.sendToHome();
    expect(received.map((r) => r.method)).toEqual(['sendToHome', 'waitForBackground']);
  });

  it('device.sendUserNotification / sendUserActivity address the last-launched app', async () => {
    const { received } = await initCompat();
    await device.launchApp();
    received.length = 0;
    await device.sendUserNotification({ title: 'From push' });
    await device.sendUserActivity({ activityType: 'NSUserActivityTypeBrowsingWeb' });
    expect(received.map((r) => r.method)).toEqual(['deliverPayload', 'deliverPayload']);
    // A LIVE delivery is not delayed — that flag belongs to the resume path.
    expect(received[0]?.params).not.toHaveProperty('delayPayload', true);
  });
});

describe('the resume’s dead-handle fallback and the URL lane', () => {
  /**
   * @issue DTX-4008
   * A resume returns `false` when the handle turns out to be a corpse, so the caller falls back
   * to a fresh launch — what v20's `simctl launch` over a dead app amounted to.
   */
  it('a resume over a CORPSE becomes a fresh launch — v20’s simctl-over-a-dead-app', async () => {
    const { received, server } = await initCompat();
    await device.launchApp();
    // The app died without anyone noticing: the handle is a tombstone, and
    // every app-channel call answers 2013.
    server.onRequest('foregroundApp', () => {
      throw new DetoxError('The app behind this handle is gone', {
        code: DetoxErrorCode.DETOX_APP_DIED,
      });
    });
    received.length = 0;
    await device.launchApp({ newInstance: false });
    // The overriding handler above replaces the recorder, so the refused
    // foreground leaves no row — what matters is that a LAUNCH followed it.
    expect(received.map((r) => r.method)).toEqual(['launchApp']);
  });

  it('a dead handle mid-PAYLOAD also falls through to a fresh launch, payload and all', async () => {
    const { received, server } = await initCompat();
    await device.launchApp();
    server.onRequest('deliverPayload', () => {
      throw new DetoxError('The app behind this handle is gone', {
        code: DetoxErrorCode.DETOX_APP_DIED,
      });
    });
    received.length = 0;
    await device.launchApp({ newInstance: false, userActivity: { activityType: 'browse' } });
    expect(received.map((r) => r.method)).toEqual(['launchApp']);
    expect(received.at(-1)?.params).toMatchObject({ userActivity: { activityType: 'browse' } });
  });

  it('a resume failure that is NOT death propagates untouched', async () => {
    const { server } = await initCompat();
    await device.launchApp();
    server.onRequest('foregroundApp', () => {
      throw new DetoxError('nope', { code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    });
    await expect(device.launchApp({ newInstance: false })).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
    });
  });

  /**
   * @issue DTX-4014
   * A launch that dies before the app reports ready is v20's "early crash": the fixture reads
   * the native report out of the error's stack, so the rejection leaves this surface in v20's
   * wording (see `v20-errors.ts`).
   */
  it('a launch that dies before ready reaches the fixture in v20’s wording', async () => {
    const { server } = await initCompat();
    server.onRequest('launchApp', () => {
      throw new DetoxError('The app behind this handle is gone (socket closed)', {
        code: DetoxErrorCode.DETOX_APP_DIED,
        details: { appReport: { errorDetails: 'JS Exception: Simulating early crash' } },
      });
    });
    await expect(
      device.launchApp({ newInstance: true, launchArgs: { simulateEarlyCrash: true } }),
    ).rejects.toThrowError(/The app has crashed, see the details below:/);
  });

  it('a RESUME with a url payload delivers it parked, then foregrounds', async () => {
    const { received } = await initCompat();
    await device.launchApp();
    received.length = 0;
    await device.launchApp({ newInstance: false, url: 'x://y', sourceApp: 'com.a' });
    expect(received.map((r) => r.method)).toEqual(['deliverPayload', 'foregroundApp']);
    expect(received[0]?.params).toMatchObject({
      url: 'x://y',
      sourceApp: 'com.a',
      delayPayload: true,
    });
  });

  it('delete refuses when the selected app declares no binary, before touching the device', async () => {
    const { received } = await initCompat({ apps: [OTHER_APP] });
    await device.selectApp('other');
    received.length = 0;
    await expect(device.launchApp({ delete: true })).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
    });
    expect(received).toEqual([]); // nothing uninstalled on the way to the refusal
  });

  it('a terminate failure that is not death still fails the switch', async () => {
    const { server } = await initCompat();
    await device.launchApp();
    server.onRequest('terminateApp', () => {
      throw new DetoxError('busy', { code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    });
    await expect(device.launchApp({ delete: true })).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
    });
  });

  /**
   * @issue DTX-4025
   * v20 `RuntimeDevice.js:287-289`: a malformed options bag is a named `DETOX_INVALID_ARGUMENT`
   * error here, not a `TypeError` from reading `.url` off a non-object, and not a refusal only
   * the server could phrase — the bad shape never reaches the wire.
   */
  it('openURL refuses a bad options bag the way v20 did, before the wire', async () => {
    await initCompat();
    for (const bad of [undefined, {}, { url: '' }, 'https://x.example']) {
      await expect(device.openURL(bad as never)).rejects.toMatchObject({
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      });
    }
  });

  /**
   * @issue DTX-4024
   * `openURL` delivers over the app channel (`RuntimeDevice.js:286-292` → `deliverPayload`)
   * whenever a launched handle exists — the frozen `deliverPayload` frame, `sourceApp` included.
   * Only with no app launched does it fall back to the device verb, and v20 had no `sourceApp`
   * there; `simctl openurl` alone would raise a SpringBoard alert nothing can dismiss.
   */
  it('openURL rides the APP channel when one is live, and the device only otherwise', async () => {
    const { received } = await initCompat();
    received.length = 0;
    await device.openURL({ url: 'x://y' });
    expect(received.at(-1)).toMatchObject({ method: 'openURL', params: { url: 'x://y' } });
    await expect(device.openURL({ url: 'x://y', sourceApp: 'com.a' })).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED,
    });
    await device.launchApp();
    received.length = 0;
    await device.openURL({ url: 'x://y', sourceApp: 'com.a' });
    expect(received.at(-1)).toMatchObject({
      method: 'deliverPayload',
      params: { url: 'x://y', sourceApp: 'com.a' },
    });
  });

  it('sendToHome survives an app that died while going home', async () => {
    const { server, received } = await initCompat();
    await device.launchApp();
    server.onRequest('waitForBackground', () => {
      throw new DetoxError('The app behind this handle is gone', {
        code: DetoxErrorCode.DETOX_APP_DIED,
      });
    });
    received.length = 0;
    await device.sendToHome(); // the device IS home; the app's death is not that
    expect(received.map((r) => r.method)).toEqual(['sendToHome']);
  });
});

/** The bit of an `invoke` frame these two tests read back. */
interface InvocationShape {
  atIndex?: number;
  predicate?: unknown;
}

/** A property the element surface does not have — the stand-in must not invent it. */
interface NotAnElementMethod {
  nope?: () => Promise<unknown>;
}

/** What `await` probes on any object — must stay absent on the stand-in. */
interface Thenable {
  then?: unknown;
}

/** The stand-in answers `valueOf`/`toString` so a fixture can print it. */
interface Printable {
  valueOf: () => unknown;
  toString: () => string;
}

describe('element() is late-bound (v20 builds matcher data, not a binding)', () => {
  /**
   * @issue DTX-4026
   * `element(by.id('x'))` builds pure matcher data in Detox 20, so suites call it wherever they
   * like, including at describe time before any app exists (`13.permissions` opens twelve
   * `describe` blocks this way) — this returns a stand-in that resolves the app handle when an
   * action is finally called.
   * @issue DTX-4028
   * v20's `atIndex` mutates the element and returns it — the index belongs to the stand-in, not
   * to any one resolved element, and survives into the later action.
   * @issue DTX-4027
   * Only the element surface's own methods are forwarded; everything else reads `undefined`,
   * which is what makes `await element(...)` resolve to the stand-in instead of hanging on a
   * fake `then`.
   * @issue DTX-4031
   * A property that is not an element verb is a typed refusal, never a silent `undefined` — an
   * `undefined()` TypeError is exactly what a bare `expectToThrow(fn)` in a ported fixture
   * swallows as success.
   * @issue DTX-4030
   * Printable: a fixture that logs an element, or builds a message from one, must not die on
   * "Cannot convert object to primitive value".
   * @issue DTX-4029
   * v20's atIndex type check (`expectTwo.js:163-164`) survives the port: a non-number is a named
   * error, not an index quietly forwarded to the serializer.
   */
  it('builds before any launch, resolves per action, and carries atIndex across', async () => {
    const { received } = await initCompat();
    const status = element(by.id('camera')).atIndex(2);
    await device.launchApp();
    received.length = 0;
    await status.tap();
    const invocation = received.at(-1)?.params.invocation as InvocationShape;
    expect(received.at(-1)?.method).toBe('invoke');
    expect(invocation.atIndex).toBe(2);
    const notAVerb = element(by.id('camera')) as unknown as NotAnElementMethod;
    await expect(notAVerb.nope!()).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED,
    });
    expect((element(by.id('camera')) as unknown as Thenable).then).toBeUndefined();
    expect(await Promise.resolve(element(by.id('camera')))).toBeTruthy();
    const printable = element(by.id('camera')) as unknown as Printable;
    expect(String(printable)).toContain('element(');
    expect(`${printable.toString()}`).toContain('camera');
    expect(printable.valueOf()).toBeTruthy();
    expect(() => element(by.id('camera')).atIndex('2' as unknown as number)).toThrowError(
      /atIndex argument must be a number, got string/,
    );
  });

  it('hands the REAL element to expect/waitFor', async () => {
    const { received } = await initCompat();
    await device.launchApp();
    received.length = 0;
    await expectElement(element(by.id('welcome')).atIndex(1)).toBeVisible();
    const invocation = received.at(-1)?.params.invocation as InvocationShape;
    expect(invocation.atIndex).toBe(1);
  });
});

describe('device.appLaunchArgs (v20 LaunchArgsEditor)', () => {
  /**
   * @issue DTX-4034
   * `modify`/`reset` act on the local scope only; `shared` is its own scope, and `get()`
   * deep-merges shared ← local (v20 `_.merge`), with local winning on a shared key.
   * @issue DTX-4035
   * A `null`/`undefined` value deletes the key rather than storing it (v20 `Storage.set`).
   * @issue DTX-4036
   * `get()` hands back a deep clone (v20 `_.cloneDeep`) — mutating the result must not reach
   * into the editor's own state.
   */
  it('merges shared under local, deletes on null, and rides the next fresh launch', async () => {
    const { received } = await initCompat();
    device.appLaunchArgs.shared.modify({ shared: 'yes', both: 'shared' });
    device.appLaunchArgs.modify({ local: 'yes', both: 'local' });
    expect(device.appLaunchArgs.get()).toEqual({
      shared: 'yes',
      both: 'local',
      local: 'yes',
    });
    device.appLaunchArgs.modify({ local: null });
    expect(device.appLaunchArgs.get()).not.toHaveProperty('local');

    await device.launchApp();
    expect(received.at(-1)?.params).toMatchObject({
      launchArgs: { shared: 'yes', both: 'local' },
    });

    // `reset()` clears local only — shared survives, exactly as in v20.
    device.appLaunchArgs.reset();
    expect(device.appLaunchArgs.get()).toEqual({ shared: 'yes', both: 'shared' });
    const snapshot = device.appLaunchArgs.get();
    snapshot.shared = 'mutated';
    expect(device.appLaunchArgs.get()).toMatchObject({ shared: 'yes' });
  });

  /**
   * @issue DTX-4017
   * v20 `RuntimeDevice.js:111-112`: the local scope is reset and re-seeded from the incoming
   * app's config on every select; `shared` survives.
   */
  it('selectApp resets the LOCAL scope and re-seeds it from the app config', async () => {
    await initCompat({
      apps: [
        { ...EXAMPLE_APP, launchArgs: { fromConfig: 'example' } },
        { ...OTHER_APP, launchArgs: { fromConfig: 'other' } },
      ],
    });
    await device.selectApp('example');
    device.appLaunchArgs.modify({ adHoc: 'kept-until-select' });
    expect(device.appLaunchArgs.get()).toEqual({
      fromConfig: 'example',
      adHoc: 'kept-until-select',
    });
    await device.selectApp('other');
    expect(device.appLaunchArgs.get()).toEqual({ fromConfig: 'other' });
  });
});

describe('app-channel verbs on the current app', () => {
  it('reloadReactNative and terminateApp address the live handle', async () => {
    const { received } = await initCompat();
    await expect(device.reloadReactNative()).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NOT_INITIALIZED, // no app launched yet
    });
    await device.launchApp();
    await device.reloadReactNative();
    expect(received.at(-1)).toEqual({
      method: 'reloadReactNative',
      params: { allocationId: 'alloc-1', appHandleId: 'handle-1' },
    });
    await device.terminateApp();
    expect(received.at(-1)).toMatchObject({
      method: 'terminateApp',
      params: { appHandleId: 'handle-1' },
    });
    await expect(element(by.text('x')).tap()).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NOT_INITIALIZED,
    });
    await expect(device.terminateApp('com.explicit.bundle')).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED,
    });
  });

  /**
   * @issue DTX-4021
   * The sync-settings trio routes to the current app's handle — the setting lives in one app's
   * Detox instrumentation, so "no app launched" is the correct refusal.
   * @issue DTX-4022
   * v20 normalized RegExp entries into portable pattern strings on this path
   * (`RuntimeDevice.js:334`); without it a v20 suite passing a RegExp would refuse where it used
   * to work.
   */
  it('the sync-settings trio rides one setSyncSettings frame on the live handle', async () => {
    const { received } = await initCompat();
    await expect(device.disableSynchronization()).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NOT_INITIALIZED,
    });
    await device.launchApp();
    await device.disableSynchronization();
    expect(received.at(-1)).toEqual({
      method: 'setSyncSettings',
      params: { allocationId: 'alloc-1', appHandleId: 'handle-1', enabled: false },
    });
    await device.enableSynchronization();
    expect(received.at(-1)).toEqual({
      method: 'setSyncSettings',
      params: { allocationId: 'alloc-1', appHandleId: 'handle-1', enabled: true },
    });
    await device.setURLBlacklist(['.*localhost.*', '.*wix\\.com.*']);
    expect(received.at(-1)).toEqual({
      method: 'setSyncSettings',
      params: {
        allocationId: 'alloc-1',
        appHandleId: 'handle-1',
        blacklistURLs: ['.*localhost.*', '.*wix\\.com.*'],
      },
    });
    await device.setURLBlacklist([/.*localhost.*/i, '.*raw.*']);
    expect(received.at(-1)).toEqual({
      method: 'setSyncSettings',
      params: {
        allocationId: 'alloc-1',
        appHandleId: 'handle-1',
        blacklistURLs: ['(?i:.*localhost.*)', '.*raw.*'],
      },
    });
    // Garbage refuses client-side, before any frame goes out.
    await expect(
      device.setURLBlacklist('not-an-array' as unknown as string[]),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
  });

  it('a pre-aborted trailing signal stops EVERY delegating verb before the wire', async () => {
    const { received } = await initCompat();
    await device.launchApp();
    const aborted = AbortSignal.abort();
    const before = received.length;
    const attempts: Array<() => Promise<unknown>> = [
      () => device.reloadReactNative(aborted),
      () => device.terminateApp(undefined, aborted),
      () => device.installApp('/tmp/x.app', aborted),
      () => device.uninstallApp('com.x', aborted),
      () => device.openURL({ url: 'https://x.example' }, aborted),
      () => device.setLocation(1, 2, aborted),
      () => device.setStatusBar({ time: '9:41' }, aborted),
      () => device.resetStatusBar(aborted),
      () => device.setBiometricEnrollment(true, aborted),
      () => device.matchFace(aborted),
      () => device.unmatchFace(aborted),
      () => device.matchFinger(aborted),
      () => device.unmatchFinger(aborted),
      () => device.clearKeychain(aborted),
      () => device.resetContentAndSettings(aborted),
      () => device.launchApp({ newInstance: true }, aborted),
      () => device.selectApp('example', aborted),
    ];
    for (const attempt of attempts) {
      await expect(attempt()).rejects.toMatchObject({ name: 'AbortError' });
    }
    expect(received.length).toBe(before);
    // …and the surface is still live: a refused verb tore nothing down.
    expect(device.name).toBe('iPhone 17');
    // `cleanup` is deliberately NOT in that list — see the next test.
  });

  /**
   * @issue DTX-4004
   * The abort that triggered a teardown never defeats it: an already-aborted
   * `signal` is not a refusal here. The refused variant this replaced stranded the device until
   * the server's keepalive verdict (2 min) and left the surface wedged — only a second,
   * signal-less `cleanup()` recovered.
   */
  it('cleanup TEARS DOWN under an already-aborted signal, never refuses', async () => {
    await initCompat();
    await device.launchApp();
    await expect(cleanup(AbortSignal.abort())).resolves.toBeUndefined();
    // The session really closed — that alone is what frees the device.
    expect(FakeWebSocket.created.at(-1)?.readyState).toBe(3);
    // …and the surface is uninitialized again, so a fresh `init()` works.
    await expect(device.launchApp()).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NOT_INITIALIZED,
    });
  });

  it('a pre-aborted trailing signal stops a call before the wire', async () => {
    const { received } = await initCompat();
    await device.launchApp();
    const aborter = new AbortController();
    aborter.abort(new Error('gone'));
    await expect(device.reloadReactNative(aborter.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    await expect(device.openURL({ url: 'https://x.example' }, aborter.signal)).rejects.toMatchObject(
      { name: 'AbortError' },
    );
    // The sync-settings trio joins the roster: the newest verbs are exactly
    // the ones this drift-catcher exists for.
    await expect(device.disableSynchronization(aborter.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    await expect(device.enableSynchronization(aborter.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    await expect(device.setURLBlacklist(['.*x.*'], aborter.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(
      received.some(
        (r) =>
          r.method === 'reloadReactNative' ||
          r.method === 'openURL' ||
          r.method === 'setSyncSettings',
      ),
    ).toBe(false);
  });
});

describe('the device-utility delegations (spec 005 surface, v20 signatures)', () => {
  it('routes each verb through the v21 device handle', async () => {
    const { received } = await initCompat();
    await device.openURL({ url: 'https://x.example' });
    expect(received.at(-1)).toMatchObject({
      method: 'openURL',
      params: { url: 'https://x.example' },
    });
    await expect(
      device.openURL({ url: 'https://x.example', sourceApp: 'com.apple.mobilesafari' }),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED });

    await device.setLocation(32.0853, 34.7818);
    await device.setStatusBar({ time: '9:41' });
    await device.resetStatusBar();
    await device.setBiometricEnrollment(true);
    await device.matchFace();
    await device.unmatchFace();
    await device.matchFinger();
    await device.unmatchFinger();
    await device.clearKeychain();
    await device.resetContentAndSettings();
    await device.uninstallApp(); // defaults to the selected app's bundle id
    expect(received.at(-1)).toMatchObject({
      method: 'uninstallApp',
      params: { appId: 'com.wix.detox-example' },
    });
    await device.uninstallApp('com.explicit');
    expect(received.at(-1)).toMatchObject({ method: 'uninstallApp', params: { appId: 'com.explicit' } });
    await device.installApp(); // defaults to the selected app's binaryPath
    expect(received.at(-1)).toMatchObject({ method: 'installApp', params: BLOB_PARAMS });
    const defaultHex = (received.at(-1)?.params.blob as WireBlobRef).hex;
    await device.installApp(anotherBundle.appPath);
    expect(received.at(-1)).toMatchObject({ method: 'installApp', params: BLOB_PARAMS });
    // A different bundle is a different content hash — the explicit argument
    // really was archived, not the configured default again.
    expect((received.at(-1)?.params.blob as WireBlobRef).hex).not.toBe(defaultHex);

    expect(
      received.map((r) => r.method).filter((m) => m !== 'installApp' && m !== 'uninstallApp'),
    ).toEqual([
      'openURL',
      'setLocation',
      'setStatusBar',
      'resetStatusBar',
      'setBiometricEnrollment',
      'matchFace',
      'unmatchFace',
      'matchFinger',
      'unmatchFinger',
      'clearKeychain',
      'resetContentAndSettings',
    ]);
  });

  it('installApp with no argument refuses when the selected app has no binaryPath', async () => {
    await initCompat({ apps: [{ name: 'binless', bundleId: 'com.wix.binless' }] });
    await expect(device.installApp()).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
    });
  });
});

describe('the unported v20 surface', () => {
  it('every unported verb is a typed refusal naming itself — never a silent no-op', async () => {
    await initCompat();
    const refusals: Array<() => Promise<never>> = [
      () => device.shake(),
      () => device.setOrientation(),
      () => device.resetAppState(),
      () => device.takeScreenshot(),
      () => device.captureViewHierarchy(),
      () => device.generateViewHierarchyXml(),
      () => device.pressBack(),
      () => device.reverseTcpPort(),
      () => device.unreverseTcpPort(),
    ];
    for (const method of refusals) {
      await expect(method()).rejects.toMatchObject({
        code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED,
      });
    }
    // The launch-args accessor is a real, enumeration-safe object — spreading
    // `device` must not explode.
    expect(Object.keys({ ...device })).toContain('appLaunchArgs');
  });
});

describe('the session door (spec 013)', () => {
  it('refuses every member before init, and after init is the live v21 handle; disconnect is cleanup', async () => {
    for (const read of [
      (): unknown => session.runId,
      (): unknown => session.log,
      (): unknown => session.step('x'),
      (): unknown => session.allocateDevice({ type: 'ios.simulator' }),
      (): unknown => session.on('operation', () => undefined),
      (): unknown => session.off('operation', () => undefined),
    ]) {
      expect(read).toThrow(expect.objectContaining({ code: DetoxErrorCode.DETOX_NOT_INITIALIZED }) as Error);
    }

    const { server } = await initCompat();
    const steps: Record<string, unknown>[] = [];
    server.peer.onNotify({ method: '$/log', handler: (params) => steps.push(params as Record<string, unknown>) });
    expect(session.runId).toBe('fake-connection');
    const operations: string[] = [];
    const listener = (operation: DetoxOperationRef): void => {
      operations.push(operation.name);
    };
    expect(session.on('operation', listener)).toBe(session);
    await session.step('outer', async () => {
      session.log('inside');
      await session.allocateDevice({ type: 'ios.simulator' });
    });
    expect(session.off('operation', listener)).toBe(session);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(operations).toEqual(['allocateDevice']);
    expect(steps[0]).toMatchObject({ phase: 'begin', kind: 'step', name: 'outer' });
    expect(steps[1]).toMatchObject({ phase: 'log', msg: 'inside' });
    expect(steps[2]).toMatchObject({ phase: 'end', status: 'passed' });

    await session.disconnect();
    expect(() => session.runId).toThrow(expect.objectContaining({ code: DetoxErrorCode.DETOX_NOT_INITIALIZED }) as Error);
    await initCompat();
    await session[Symbol.asyncDispose]();
    expect(() => session.log).toThrow(expect.objectContaining({ code: DetoxErrorCode.DETOX_NOT_INITIALIZED }) as Error);
  });
});
