/**
 * The client half of spec 006: the widened `launchApp` options, the two new
 * device verbs (`setPermissions`, `sendToHome`), and the app handle's
 * lifecycle verbs (`foreground`, the state waits, live payloads).
 *
 * What is under test is the wire shape and the dialect discipline, not the
 * semantics (the server owns those; validation is server-side because a
 * relay cannot trust a client's): the payload verbs ride `deliverPayload`
 * with `delayUntilActive` mapped to `delayPayload`, and every call is
 * addressed by allocation + app handle.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AllocateDeviceResponse } from '@detox-remote/protocol';

import { connect } from '../../client';
import type { DetoxApp, DetoxDevice, DetoxOperationRef } from '../../client';
import { FakeWebSocket, connectFakeServer, type FakeServer } from './helpers/fake-transport';

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
  apps: { serverUrl: 'ws://127.0.0.1:5599' },
};

interface Received {
  method: string;
  params: Record<string, unknown>;
}

interface Fixture {
  device: DetoxDevice;
  app: DetoxApp;
  received: Received[];
  operations: DetoxOperationRef[];
  server: FakeServer;
  dispose: () => Promise<void>;
}

async function withApp(): Promise<Fixture> {
  const sessionPromise = connect({ server: 'ws://fake-host/detox' });
  const server = connectFakeServer();
  const received: Received[] = [];
  server.onRequest('allocateDevice', async () => allocation);
  server.onRequest('releaseDevice', async () => ({ released: true }));
  server.onRequest<Record<string, unknown>, { pid: number; appHandleId: string }>(
    'launchApp',
    async (params) => {
      received.push({ method: 'launchApp', params });
      return { pid: 4242, appHandleId: 'app-handle-1' };
    },
  );
  for (const method of [
    'setPermissions',
    'sendToHome',
    'foregroundApp',
    'waitForActive',
    'waitForBackground',
    'deliverPayload',
  ]) {
    server.onRequest<Record<string, unknown>, null>(method, async (params) => {
      received.push({ method, params });
      return null;
    });
  }
  const session = await sessionPromise;
  const operations: DetoxOperationRef[] = [];
  session.on('operation', (operation) => operations.push(operation));
  const device = await session.allocateDevice({ type: 'ios.simulator' });
  const app = await device.launchApp('com.example.app');
  return { device, app, received, operations, server, dispose: () => session.disconnect() };
}

const APP_ADDRESS = { allocationId: 'alloc-1', appHandleId: 'app-handle-1' };

describe('launchApp options travel verbatim, and only when present', () => {
  beforeEach(() => {
    FakeWebSocket.created.length = 0;
  });

  it('a bare launch sends only the address — no undefined-valued option keys', async () => {
    const { received, dispose } = await withApp();
    expect(received[0]).toEqual({
      method: 'launchApp',
      params: { allocationId: 'alloc-1', appId: 'com.example.app' },
    });
    await dispose();
  });

  /**
   * @issue DTX-3016
   * Options travel verbatim, and only when present. Validation is the
   * server's alone — a relay cannot trust a client's validation, so
   * duplicating it here would just be a second, unenforced copy.
   */
  it('every option rides through unchanged — validation is the server’s alone', async () => {
    const { device, received, dispose } = await withApp();
    await device.launchApp('com.example.app', {
      launchArgs: { mockServerPort: 9001, detoxEnableSynchronization: 0 },
      languageAndLocale: { language: 'es-MX', locale: 'en_MX' },
      userNotification: { note: 'a value' },
      readyTimeoutMs: 5000,
    });
    expect(received.at(-1)).toEqual({
      method: 'launchApp',
      params: {
        allocationId: 'alloc-1',
        appId: 'com.example.app',
        launchArgs: { mockServerPort: 9001, detoxEnableSynchronization: 0 },
        languageAndLocale: { language: 'es-MX', locale: 'en_MX' },
        userNotification: { note: 'a value' },
        readyTimeoutMs: 5000,
      },
    });

    await device.launchApp('com.example.app', {
      url: 'scheme://x',
      sourceApp: 'com.example.src',
      userActivity: undefined,
    });
    expect(received.at(-1)?.params).toEqual({
      allocationId: 'alloc-1',
      appId: 'com.example.app',
      url: 'scheme://x',
      sourceApp: 'com.example.src',
    });
    await dispose();
  });

  it('readyTimeoutMs: 0 reaches the wire as a value — presence is !== undefined, not truthiness', async () => {
    const { device, received, dispose } = await withApp();
    await device.launchApp('com.example.app', { readyTimeoutMs: 0 });
    expect(received.at(-1)?.params.readyTimeoutMs).toBe(0);
    await dispose();
  });
});

describe('the device verbs (spec 006)', () => {
  beforeEach(() => {
    FakeWebSocket.created.length = 0;
  });

  it('setPermissions and sendToHome address by allocation and register as operations', async () => {
    const { device, received, operations, dispose } = await withApp();
    operations.length = 0;
    await device.setPermissions('com.example.app', { camera: 'YES', photos: 'limited' });
    expect(received.at(-1)).toEqual({
      method: 'setPermissions',
      params: {
        allocationId: 'alloc-1',
        appId: 'com.example.app',
        permissions: { camera: 'YES', photos: 'limited' },
      },
    });
    expect(operations.at(-1)?.name).toBe('setPermissions');

    await device.sendToHome();
    expect(received.at(-1)).toEqual({
      method: 'sendToHome',
      params: { allocationId: 'alloc-1' },
    });
    expect(operations.at(-1)?.name).toBe('sendToHome');
    await dispose();
  });
});

describe('the app handle’s lifecycle verbs (spec 006)', () => {
  beforeEach(() => {
    FakeWebSocket.created.length = 0;
  });

  it('foreground and the state waits carry the full app address', async () => {
    const { app, received, operations, dispose } = await withApp();
    operations.length = 0;
    await app.foreground();
    expect(received.at(-1)).toEqual({ method: 'foregroundApp', params: APP_ADDRESS });
    await app.waitForActive();
    expect(received.at(-1)).toEqual({ method: 'waitForActive', params: APP_ADDRESS });
    await app.waitForBackground();
    expect(received.at(-1)).toEqual({ method: 'waitForBackground', params: APP_ADDRESS });
    // Real operations, announced by name — unlike the per-tap element lane.
    expect(operations.map((operation) => operation.name)).toEqual([
      'foreground',
      'waitForActive',
      'waitForBackground',
    ]);
    await dispose();
  });

  it('sendUserNotification/sendUserActivity ride deliverPayload as VALUES', async () => {
    const { app, received, operations, dispose } = await withApp();
    operations.length = 0;
    const note = { title: 'hi', payload: { answer: 42 } };
    await app.sendUserNotification(note);
    expect(received.at(-1)).toEqual({
      method: 'deliverPayload',
      params: { ...APP_ADDRESS, userNotification: note },
    });
    await app.sendUserActivity({ kind: 'browse' });
    expect(received.at(-1)).toEqual({
      method: 'deliverPayload',
      params: { ...APP_ADDRESS, userActivity: { kind: 'browse' } },
    });
    expect(operations.map((operation) => operation.name)).toEqual([
      'sendUserNotification',
      'sendUserActivity',
    ]);
    await dispose();
  });

  it('openURL rides the SAME deliverPayload frame — the app-channel door v20 used', async () => {
    const { app, received, operations, dispose } = await withApp();
    operations.length = 0;
    await app.openURL('detoxtesturlscheme://such-string');
    expect(received.at(-1)).toEqual({
      method: 'deliverPayload',
      params: { ...APP_ADDRESS, url: 'detoxtesturlscheme://such-string' },
    });
    // `sourceApp` and the parked delivery a resume-with-URL composes.
    await app.openURL('x://y', { sourceApp: 'com.apple.mobilesafari', delayUntilActive: true });
    expect(received.at(-1)).toEqual({
      method: 'deliverPayload',
      params: {
        ...APP_ADDRESS,
        url: 'x://y',
        sourceApp: 'com.apple.mobilesafari',
        delayPayload: true,
      },
    });
    expect(operations.map((operation) => operation.name)).toEqual(['openURL', 'openURL']);
    await dispose();
  });

  it('delayUntilActive: true maps to delayPayload: true; false and absent send nothing', async () => {
    const { app, received, dispose } = await withApp();
    await app.sendUserNotification({ a: 1 }, { delayUntilActive: true });
    expect(received.at(-1)?.params.delayPayload).toBe(true);
    await app.sendUserNotification({ a: 1 }, { delayUntilActive: false });
    expect(received.at(-1)?.params).not.toHaveProperty('delayPayload');
    await app.sendUserActivity({ a: 1 }, { delayUntilActive: true });
    expect(received.at(-1)?.params.delayPayload).toBe(true);
    await dispose();
  });

  it('server progress on an app verb routes onto the operation, like every device verb', async () => {
    const { app, server, operations, dispose } = await withApp();
    server.onRequest<Record<string, unknown>, null>('foregroundApp', async (_params, ctx) => {
      ctx.progress({ op: 'foreground', kind: 'progress', message: 'Resuming' });
      return null;
    });
    operations.length = 0;
    const messages: (string | undefined)[] = [];
    // Announced synchronously at creation; progress only ever arrives
    // asynchronously, so subscribing right after the call misses nothing.
    const pending = app.foreground();
    operations.at(-1)?.on('progress', (event) => messages.push(event.message));
    await pending;
    expect(messages).toEqual(['Resuming']);
    await dispose();
  });

  it('a pre-aborted signal stops a verb before anything reaches the wire', async () => {
    const { app, received, dispose } = await withApp();
    received.length = 0;
    const reason = new Error('aborted before the call');
    const preAborted = { signal: AbortSignal.abort(reason) };
    for (const attempt of [
      app.foreground(preAborted),
      app.waitForActive(preAborted),
      app.waitForBackground(preAborted),
      app.sendUserNotification({ a: 1 }, preAborted),
      app.sendUserActivity({ a: 1 }, preAborted),
    ]) {
      await expect(attempt).rejects.toMatchObject({ name: 'AbortError', cause: reason });
    }
    expect(received).toEqual([]);
    await dispose();
  });
});
