/**
 * The client half of the app gateway (spec 003): `device.installApp`,
 * `device.launchApp`, and the app handle's element channel.
 *
 * The serializer assertions deep-equal against the same fixtures the accept
 * suite lifted from Detox 20's own serializer tests (`expectTwo.test.js`) —
 * the wire `invocation` must be byte-for-byte what the frozen native side
 * accepts, because the server relays it without looking inside.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AllocateDeviceResponse } from '@detox-remote/protocol';
import { DetoxError, DetoxErrorCode } from '@detox-remote/core';

import { init } from '../../internals';
import type { DetoxApp, DetoxDevice } from '../../internals';
import { FakeWebSocket, connectFakeServer, type FakeServer } from './helpers/fake-transport';
import { startBlobLaneStub } from './helpers/blob-lane-stub';
import { makeAppBundleFixture } from './helpers/app-bundle-fixture';

vi.mock('ws', async () => {
  const { FakeWebSocket: FakeWebSocketCtor } = await import('./helpers/fake-transport');
  return { default: FakeWebSocketCtor };
});

const allocation: AllocateDeviceResponse = {
  allocationId: 'alloc-1',
  device: { udid: 'udid-1' },
  name: 'iPhone 17',
  os: 'iOS 26.5',
  state: 'booted',
};

/** Byte-for-byte fixtures — Detox 20 `expectTwo.test.js:31-41,381-392`. */
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

interface Received {
  method: string;
  params: Record<string, unknown>;
}

/** The wire shape of the blob param, for reading it back off `received`. */
interface WireBlobRef {
  algo: string;
  hex: string;
}

interface Fixture {
  device: DetoxDevice;
  received: Received[];
  server: FakeServer;
  dispose: () => Promise<void>;
}

async function withDevice(
  options: { signal?: AbortSignal; serverUrl?: string } = {},
): Promise<Fixture> {
  const sessionPromise = init({
    server: options.serverUrl ?? 'ws://fake-host/detox',
    signal: options.signal,
  });
  const server = connectFakeServer();
  const received: Received[] = [];
  server.onRequest('allocateDevice', async () => allocation);
  server.onRequest('releaseDevice', async () => ({ released: true }));
  server.onRequest<Record<string, unknown>, null>('installApp', async (params) => {
    received.push({ method: 'installApp', params });
    return null;
  });
  server.onRequest<Record<string, unknown>, { pid: number; appHandleId: string }>(
    'launchApp',
    async (params) => {
      received.push({ method: 'launchApp', params });
      return { pid: 4242, appHandleId: 'app-handle-1' };
    },
  );
  server.onRequest<Record<string, unknown>, null>('terminateApp', async (params) => {
    received.push({ method: 'terminateApp', params });
    return null;
  });
  const session = await sessionPromise;
  const device = await session.allocateDevice({ type: 'ios.simulator' });
  return { device, received, server, dispose: () => session.disconnect() };
}

async function withApp(fixture?: Fixture): Promise<Fixture & { app: DetoxApp }> {
  const f = fixture ?? (await withDevice());
  const app = await f.device.launchApp('com.example.app');
  return { ...f, app };
}

describe('DetoxDevice — installApp and launchApp', () => {
  beforeEach(() => {
    FakeWebSocket.created.length = 0;
  });

  /**
   * @issue DTX-3015
   * `installApp` on a local bundle archives it, hashes the archive, uploads
   * once if the server lacks it, and installs by hash — works no matter
   * where the server is. The ws transport here is faked, but the blob lane
   * is real: the session dials the stub's actual loopback address over
   * HTTP, so what is asserted is the client's genuine wire behavior.
   */
  it('installApp pushes a local bundle through the blob lane and installs by hash (spec 007)', async () => {
    const lane = await startBlobLaneStub();
    const bundle = await makeAppBundleFixture();
    const { device, received, dispose } = await withDevice({ serverUrl: lane.url });
    try {
      await device.installApp(bundle.appPath);
      const wire = received.at(-1);
      expect(wire?.method).toBe('installApp');
      expect(wire?.params.appPath).toBeUndefined();
      const blob = wire?.params.blob as WireBlobRef;
      expect(blob.algo).toBe('sha256');
      expect(blob.hex).toMatch(/^[0-9a-f]{64}$/);
      expect(lane.requests.map((r) => r.method)).toEqual(['HEAD', 'PUT']);
      expect(lane.requests[0].path).toBe(`/v1/blobs/sha256/${blob.hex}`);

      // The unchanged bundle re-installs WITHOUT re-upload: the archive
      // recipe is deterministic, so the second probe is a hash hit.
      await device.installApp(bundle.appPath);
      expect(lane.requests.map((r) => r.method)).toEqual(['HEAD', 'PUT', 'HEAD']);
      expect((received.at(-1)?.params.blob as WireBlobRef).hex).toBe(blob.hex);

      // Anything that is not a .app bundle directory dies CLIENT-side,
      // before a byte moves — no wire call, no lane request.
      const laneCalls = lane.requests.length;
      const wireCalls = received.length;
      await expect(device.installApp('/tmp/definitely-missing.app')).rejects.toMatchObject({
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      });
      expect(lane.requests.length).toBe(laneCalls);
      expect(received.length).toBe(wireCalls);
    } finally {
      await dispose();
      await lane.close();
      await bundle.dispose();
    }
  });

  /**
   * @issue DTX-3013
   * At most one transparent re-upload round (HEAD→PUT→retry) on a
   * transfer-failed install: the retry targets an eviction racing the
   * install, and every phase narrates so a multi-hundred-megabyte call is
   * never silent. A second failure surfaces as-is (see the next test).
   */
  it('installApp re-uploads ONCE when the server lost the blob mid-install (eviction race)', async () => {
    const lane = await startBlobLaneStub();
    const bundle = await makeAppBundleFixture('Racy');
    const { device, received, server, dispose } = await withDevice({ serverUrl: lane.url });
    try {
      let calls = 0;
      server.onRequest<Record<string, unknown>, null>('installApp', async (params) => {
        received.push({ method: 'installApp', params });
        calls += 1;
        if (calls === 1) {
          // A real eviction forgets the bytes too — so the retry's HEAD
          // misses and the client must re-PUT, not just re-ask.
          lane.stored.clear();
          throw new DetoxError('the server does not hold that blob', {
            code: DetoxErrorCode.DETOX_APP_TRANSFER_FAILED,
          });
        }
        return null;
      });
      const messages: string[] = [];
      await device.installApp(bundle.appPath, {
        onProgress: (event) => {
          if (event.message) messages.push(event.message);
        },
      });
      expect(calls).toBe(2);
      expect(lane.requests.map((r) => r.method)).toEqual(['HEAD', 'PUT', 'HEAD', 'PUT']);
      // The narration gate (spec 007): a lane install is never silent, and
      // every phase speaks — archive, upload, and the retry says why.
      expect(messages.join('\n')).toMatch(/Archiving/);
      expect(messages.join('\n')).toMatch(/Uploading/);
      expect(messages.join('\n')).toMatch(/re-upload/i);
    } finally {
      await dispose();
      await lane.close();
      await bundle.dispose();
    }
  });

  it('the transparent re-upload happens AT MOST once — a second failure surfaces', async () => {
    const lane = await startBlobLaneStub();
    const bundle = await makeAppBundleFixture('Doomed');
    const { device, received, server, dispose } = await withDevice({ serverUrl: lane.url });
    try {
      let calls = 0;
      server.onRequest<Record<string, unknown>, null>('installApp', async (params) => {
        received.push({ method: 'installApp', params });
        calls += 1;
        lane.stored.clear();
        throw new DetoxError('the server does not hold that blob', {
          code: DetoxErrorCode.DETOX_APP_TRANSFER_FAILED,
        });
      });
      await expect(device.installApp(bundle.appPath)).rejects.toMatchObject({
        code: DetoxErrorCode.DETOX_APP_TRANSFER_FAILED,
      });
      expect(calls).toBe(2);
    } finally {
      await dispose();
      await lane.close();
      await bundle.dispose();
    }
  });

  /**
   * @issue DTX-3014
   * An http(s) URL travels verbatim — the server fetches the archive itself.
   * `path.resolve` would mangle a URL, so it is passed through untouched.
   */
  it('installApp sends an http(s) URL VERBATIM — path resolution would mangle it', async () => {
    const { device, received, dispose } = await withDevice();
    await device.installApp('https://ci.example.com/builds/App.app.zip');
    expect(received.at(-1)).toEqual({
      method: 'installApp',
      params: { allocationId: 'alloc-1', appPath: 'https://ci.example.com/builds/App.app.zip' },
    });
    // The scheme test is case-insensitive, like URL schemes themselves.
    await device.installApp('HTTP://ci.example.com/App.tgz');
    expect(received.at(-1)?.params.appPath).toBe('HTTP://ci.example.com/App.tgz');
    await dispose();
  });

  it('launchApp addresses by allocation and hands back a handle naming the real pid', async () => {
    const { received, app, dispose } = await withApp();
    expect(received.at(-1)).toEqual({
      method: 'launchApp',
      params: { allocationId: 'alloc-1', appId: 'com.example.app' },
    });
    expect(app.bundleId).toBe('com.example.app');
    expect(app.pid).toBe(4242);
    const { by, element, expect: expectElement, waitFor } = app;
    expect(typeof by.id).toBe('function');
    expect(typeof element).toBe('function');
    expect(typeof expectElement).toBe('function');
    expect(typeof waitFor).toBe('function');
    await dispose();
  });
});

describe('the app handle — element channel serialization', () => {
  beforeEach(() => {
    FakeWebSocket.created.length = 0;
  });

  it('tap and toBeVisible ride the wire as Detox 20 serializes them, addressed by allocation and handle', async () => {
    const { app, received, server, dispose } = await withApp();
    server.onRequest<Record<string, unknown>, { result?: unknown }>('invoke', async (params) => {
      received.push({ method: 'invoke', params });
      return {};
    });

    await app.element(app.by.text('tapMe')).tap();
    expect(received.at(-1)).toEqual({
      method: 'invoke',
      params: {
        allocationId: 'alloc-1',
        appHandleId: 'app-handle-1',
        invocation: TAP_INVOCATION,
      },
    });

    await app.expect(app.element(app.by.text('Tap Working!!!'))).toBeVisible();
    expect(received.at(-1)?.params.invocation).toEqual(VISIBLE_INVOCATION);

    // `by.id` — the other matcher this spec pins.
    await app.element(app.by.id('hello-button')).tap();
    expect(received.at(-1)?.params.invocation).toEqual({
      type: 'action',
      action: 'tap',
      predicate: { type: 'id', value: 'hello-button', isRegex: false },
    });
    await dispose();
  });

  /**
   * @issue DTX-3002
   * A matcher is stateless data, not bound to the app that built it, so a
   * matcher built by one app's `by` is legal input to another app's
   * `element`.
   *
   * @issue DTX-3003
   * `expect`/`waitFor` route through the ELEMENT's own executor, not the
   * entry point that calls them: an expectation built through one app's
   * `expect` on another app's element still rides the element's own
   * channel. Routing by the entry point instead would silently split
   * action and assertion across two apps.
   */
  it('a matcher is stateless data: one handle’s `by` feeds another handle’s `element`', async () => {
    const fixture = await withDevice();
    const alpha = await fixture.device.launchApp('com.example.alpha');
    const beta = await fixture.device.launchApp('com.example.beta');
    fixture.server.onRequest<Record<string, unknown>, { result?: unknown }>(
      'invoke',
      async (params) => {
        fixture.received.push({ method: 'invoke', params });
        return {};
      },
    );

    await beta.element(alpha.by.text('tapMe')).tap();
    const last = fixture.received.at(-1);
    expect(last?.params.invocation).toEqual(TAP_INVOCATION);
    // Routed by the ELEMENT's handle (beta), not the matcher's origin.
    expect(last?.params.appHandleId).toBe('app-handle-1');

    await alpha.expect(beta.element(beta.by.text('tapMe'))).toBeVisible();
    expect(fixture.received.at(-1)?.params.appHandleId).toBe('app-handle-1');
    await fixture.dispose();
  });

  it('surfaces the app’s typed verdicts with details intact', async () => {
    const { app, server, dispose } = await withApp();
    server.onRequest('invoke', async () => {
      throw new DetoxError('The app rejected an expectation', {
        code: DetoxErrorCode.DETOX_EXPECTATION_FAILED,
        details: { details: 'spec003-unseen-element' },
      });
    });
    await expect(app.expect(app.element(app.by.text('x'))).toBeVisible()).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_EXPECTATION_FAILED,
      details: { details: 'spec003-unseen-element' },
    });
    await dispose();
  });

  it('refuses foreign objects where a matcher or element is expected', async () => {
    const { app, dispose } = await withApp();
    // A JS caller can hand anything to these entry points — which is exactly
    // why the implementation validates at run time (v20's own guard).
    expect(() => app.element({} as never)).toThrowError(
      expect.objectContaining({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT }),
    );
    expect(() => app.expect({} as never)).toThrowError(
      expect.objectContaining({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT }),
    );
    expect(() => app.waitFor({} as never)).toThrowError(
      expect.objectContaining({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT }),
    );
    await dispose();
  });

  it('waitFor.withTimeout rides the invoke lane with the timeout on the invocation', async () => {
    const { app, received, server, dispose } = await withApp();
    server.onRequest<Record<string, unknown>, { result?: unknown }>('invoke', async (params) => {
      received.push({ method: 'invoke', params });
      return {};
    });
    await app.waitFor(app.element(app.by.id('x'))).toBeVisible().withTimeout(100);
    expect(received.at(-1)).toMatchObject({
      method: 'invoke',
      params: {
        invocation: {
          type: 'expectation',
          expectation: 'toBeVisible',
          predicate: { type: 'id', value: 'x', isRegex: false },
          timeout: 100,
        },
      },
    });
    await dispose();
  });

  it('an already-aborted signal stops a tap before a single frame reaches the wire', async () => {
    const { app, received, server, dispose } = await withApp();
    server.onRequest<Record<string, unknown>, { result?: unknown }>('invoke', async (params) => {
      received.push({ method: 'invoke', params });
      return {};
    });
    const aborter = new AbortController();
    aborter.abort(new Error('too late'));
    await expect(
      app.element(app.by.text('tapMe')).tap({ signal: aborter.signal }),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_ABORTED });
    expect(received.some((entry) => entry.method === 'invoke')).toBe(false);
    await dispose();
  });
});

describe('the app handle — reloadReactNative', () => {
  beforeEach(() => {
    FakeWebSocket.created.length = 0;
  });

  it('addresses the reload by allocation and per-launch handle', async () => {
    const { server, received, app, dispose } = await withApp();
    server.onRequest<Record<string, unknown>, null>('reloadReactNative', async (params) => {
      received.push({ method: 'reloadReactNative', params });
      return null;
    });
    await app.reloadReactNative();
    expect(received.at(-1)).toEqual({
      method: 'reloadReactNative',
      params: { allocationId: 'alloc-1', appHandleId: 'app-handle-1' },
    });
    await dispose();
  });

  it('an already-aborted signal stops a reload before a single frame reaches the wire', async () => {
    const { server, received, app, dispose } = await withApp();
    server.onRequest<Record<string, unknown>, null>('reloadReactNative', async (params) => {
      received.push({ method: 'reloadReactNative', params });
      return null;
    });
    const aborter = new AbortController();
    aborter.abort(new Error('gone'));
    await expect(app.reloadReactNative({ signal: aborter.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(received.some((entry) => entry.method === 'reloadReactNative')).toBe(false);
    await dispose();
  });
});

describe('the app handle — terminate and disposal', () => {
  beforeEach(() => {
    FakeWebSocket.created.length = 0;
  });

  it('terminate names the allocation, the bundle, and the per-launch handle', async () => {
    const { app, received, dispose } = await withApp();
    await app.terminate();
    expect(received.at(-1)).toEqual({
      method: 'terminateApp',
      params: {
        allocationId: 'alloc-1',
        appId: 'com.example.app',
        appHandleId: 'app-handle-1',
      },
    });
    await dispose();
  });

  it('disposal terminates once, and never again after an explicit terminate', async () => {
    const { app, received, dispose } = await withApp();
    await app.terminate();
    const calls = received.filter((entry) => entry.method === 'terminateApp').length;
    await app[Symbol.asyncDispose]();
    expect(received.filter((entry) => entry.method === 'terminateApp').length).toBe(calls);
    await dispose();
  });

  it('disposal swallows a dead app and a released device, but nothing else', async () => {
    const fixture = await withDevice();
    const dead = await fixture.device.launchApp('com.example.dead');
    const stale = await fixture.device.launchApp('com.example.stale');
    const broken = await fixture.device.launchApp('com.example.broken');
    const answers = new Map<string, () => never>([
      [
        'com.example.dead',
        () => {
          throw new DetoxError('gone', { code: DetoxErrorCode.DETOX_APP_DIED });
        },
      ],
      [
        'com.example.stale',
        () => {
          throw new DetoxError('released', { code: DetoxErrorCode.DETOX_STALE_HANDLE });
        },
      ],
      [
        'com.example.broken',
        () => {
          throw new DetoxError('bad input', { code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
        },
      ],
    ]);
    fixture.server.onRequest<{ appId: string }, null>('terminateApp', async (params) => {
      answers.get(params.appId)?.();
      return null;
    });

    await dead[Symbol.asyncDispose]();
    await stale[Symbol.asyncDispose]();
    await expect(broken[Symbol.asyncDispose]()).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
    });
    await fixture.dispose();
  });

  it('composes the session signal into app calls (AbortSignal-first)', async () => {
    FakeWebSocket.created.length = 0;
    const sessionAborter = new AbortController();
    const { app, received, server, dispose } = await withApp(
      await withDevice({ signal: sessionAborter.signal }),
    );
    server.onRequest<Record<string, unknown>, { result?: unknown }>('invoke', async (params) => {
      received.push({ method: 'invoke', params });
      return {};
    });
    sessionAborter.abort(new Error('session over'));
    await expect(app.element(app.by.text('tapMe')).tap()).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_ABORTED,
    });
    expect(received.some((entry) => entry.method === 'invoke')).toBe(false);
    await dispose();
  });
});
