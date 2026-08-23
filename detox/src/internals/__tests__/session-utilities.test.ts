/**
 * The client half of spec 005: the twelve utility methods on `DetoxDevice`.
 *
 * What is under test is that each one behaves like every other call in the
 * dialect rather than like a convenience wrapper someone bolted on: it is an
 * operation of its own name (so it narrates and shows up on
 * `detox.on('operation')`), it inherits the session signal, it carries the
 * allocationId as its only address, and a signal that is already aborted stops
 * it before a single frame reaches the wire.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AllocateDeviceResponse, ReleaseDeviceRequest, ReleaseDeviceResponse } from '@detox-remote/protocol';
import { DetoxError, DetoxErrorCode } from '@detox-remote/core';

import { init } from '../../internals';
import type { DetoxDevice, DetoxOperationRef, DetoxProgressEvent } from '../../internals';
import { FakeWebSocket, connectFakeServer, type FakeServer } from './helpers/fake-transport';

// Same fake, and same reason for the dynamic import inside the factory, as
// session-devices.test.ts.
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

interface Received {
  method: string;
  params: Record<string, unknown>;
}

/**
 * A session with one allocated device, and a log of every wire request the
 * server side saw. Utility methods answer `null` — they are `void` on the wire.
 */
async function withDevice(options: { signal?: AbortSignal } = {}): Promise<{
  device: DetoxDevice;
  received: Received[];
  releases: string[];
  server: FakeServer;
  operations: DetoxOperationRef[];
  dispose: () => Promise<void>;
}> {
  const sessionPromise = init({ server: 'ws://fake-host/detox', signal: options.signal });
  const server = connectFakeServer();
  const received: Received[] = [];
  const releases: string[] = [];
  server.onRequest('allocateDevice', async () => allocation);
  server.onRequest<ReleaseDeviceRequest, ReleaseDeviceResponse>('releaseDevice', async (params) => {
    releases.push(params.allocationId);
    return { released: true };
  });
  for (const method of [
    'uninstallApp',
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
  return { device, received, releases, server, operations, dispose: () => session.disconnect() };
}

/** Every utility, called through the public sugar, with what it must send. */
const CALLS: readonly [string, (device: DetoxDevice) => Promise<void>, Record<string, unknown>][] = [
  ['uninstallApp', (d) => d.uninstallApp('com.example.doomed'), { appId: 'com.example.doomed' }],
  ['openURL', (d) => d.openURL('https://example.com/x'), { url: 'https://example.com/x' }],
  ['setLocation', (d) => d.setLocation(32.0853, 34.7818), { lat: 32.0853, lon: 34.7818 }],
  ['setStatusBar', (d) => d.setStatusBar({ time: '12:34', wifiBars: 0 }), { time: '12:34', wifiBars: 0 }],
  ['resetStatusBar', (d) => d.resetStatusBar(), {}],
  ['setBiometricEnrollment', (d) => d.setBiometricEnrollment(true), { enabled: true }],
  ['matchFace', (d) => d.matchFace(), {}],
  ['unmatchFace', (d) => d.unmatchFace(), {}],
  ['matchFinger', (d) => d.matchFinger(), {}],
  ['unmatchFinger', (d) => d.unmatchFinger(), {}],
  ['clearKeychain', (d) => d.clearKeychain(), {}],
  ['resetContentAndSettings', (d) => d.resetContentAndSettings(), {}],
];

describe('DetoxDevice — the utilities toolbelt', () => {
  beforeEach(() => {
    FakeWebSocket.created.length = 0;
  });

  it('sends each verb with the allocationId as its address, and the sugar unpacked', async () => {
    const { device, received, dispose } = await withDevice();
    for (const [method, call, expected] of CALLS) {
      await call(device);
      expect(received.at(-1)).toEqual({
        method,
        params: { allocationId: 'alloc-1', ...expected },
      });
    }
    await dispose();
  });

  it('registers each call as an operation of its own name', async () => {
    const { device, operations, dispose } = await withDevice();
    operations.length = 0;
    for (const [method, call] of CALLS) {
      await call(device);
      expect(operations.at(-1)?.name).toBe(method);
    }
    await dispose();
  });

  /**
   * The wipe is the one utility with a story to tell: its server-born `boot`
   * child must reach the caller's own `onProgress`, because the caller asked
   * about the wipe, not about the boot inside it.
   */
  it('surfaces the wipe’s server-born boot child on the caller’s onProgress', async () => {
    const { device, server, dispose } = await withDevice();
    server.onRequest<Record<string, unknown>, null>('resetContentAndSettings', async (_params, ctx) => {
      ctx.progress({ op: 'resetContentAndSettings', kind: 'progress', message: 'Erasing' });
      ctx.progress({ op: 'boot', kind: 'begin', message: 'Booting' });
      ctx.progress({ op: 'boot', kind: 'end', ok: true });
      return null;
    });

    const seen: DetoxProgressEvent[] = [];
    await device.resetContentAndSettings({ onProgress: (event) => seen.push(event) });
    expect(seen.map((event) => event.name)).toEqual(['resetContentAndSettings', 'boot']);
    await dispose();
  });

  /**
   * AbortSignal-first, priced at the cheapest observable point: an
   * already-aborted signal must stop the call before a single frame is sent —
   * "touched nothing" is not a promise about the server's diligence.
   */
  it('rejects a pre-aborted call before anything reaches the wire', async () => {
    const { device, received, dispose } = await withDevice();
    received.length = 0;
    const reason = new Error('aborted before the call');
    // Spelled out one by one rather than driven off CALLS: the sugar puts
    // options last behind each method's own arity, and that arity is exactly
    // what a caller has to get right.
    const preAborted = { signal: AbortSignal.abort(reason) };
    const attempts: Promise<void>[] = [
      device.uninstallApp('com.example.doomed', preAborted),
      device.openURL('https://example.com', preAborted),
      device.setLocation(1, 2, preAborted),
      device.setStatusBar({ time: '1:00' }, preAborted),
      device.resetStatusBar(preAborted),
      device.setBiometricEnrollment(true, preAborted),
      device.matchFace(preAborted),
      device.unmatchFace(preAborted),
      device.matchFinger(preAborted),
      device.unmatchFinger(preAborted),
      device.clearKeychain(preAborted),
      device.resetContentAndSettings(preAborted),
    ];
    for (const attempt of attempts) {
      await expect(attempt).rejects.toMatchObject({ name: 'AbortError', cause: reason });
    }
    expect(received).toEqual([]);
    await dispose();
  });

  /**
   * A call inherits the session's signal (`init({ signal })`), so tearing the
   * session down cancels utilities in flight — not just the ones the caller
   * remembered to pass a signal to.
   */
  it('inherits the session signal', async () => {
    const controller = new AbortController();
    const { device, dispose } = await withDevice({ signal: controller.signal });
    const reason = new Error('the session went away');
    const pending = device.clearKeychain();
    controller.abort(reason);
    await expect(pending).rejects.toMatchObject({ name: 'AbortError', cause: reason });
    await dispose();
  });

  /** A server-side refusal arrives typed, through the same taxonomy as the rest. */
  it('surfaces a typed server refusal unchanged', async () => {
    const { device, server, dispose } = await withDevice();
    server.onRequest('uninstallApp', () =>
      Promise.reject(
        new DetoxError('uninstallApp requires an "appId"', {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method: 'uninstallApp', parameter: 'appId' },
        }),
      ),
    );
    await expect(device.uninstallApp('')).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { method: 'uninstallApp', parameter: 'appId' },
    });
    await dispose();
  });
});

/**
 * @issue DTX-3018
 * The server can end an allocation without being asked: a wedged operation
 * killed by its own deadline leaves the device in an unknown state and takes
 * it out of the fleet. A `DETOX_DEVICE_UNKNOWN_STATE`
 * rejection is the handle's only evidence of that, and marks it released —
 * without it, the handle keeps believing it owns the device, and disposal
 * goes on to ask for a release nobody can honour.
 */
describe('a device the server took away', () => {
  beforeEach(() => {
    FakeWebSocket.created.length = 0;
  });

  it('marks the handle dead when an operation reports an unknown device state', async () => {
    const { device, releases, server, dispose } = await withDevice();
    server.onRequest('resetContentAndSettings', () =>
      Promise.reject(
        new DetoxError('simctl erase was killed after 60000ms', {
          code: DetoxErrorCode.DETOX_DEVICE_UNKNOWN_STATE,
          details: { udid: 'udid-1' },
        }),
      ),
    );

    await expect(device.resetContentAndSettings()).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_DEVICE_UNKNOWN_STATE,
      details: { udid: 'udid-1' },
    });

    // Disposal is a no-op from here: the device is not ours to hand back.
    await device[Symbol.asyncDispose]();
    expect(releases).toEqual([]);
    await dispose();
  });

  /**
   * @issue DTX-3019
   * Disposal must not turn one failure into two: `await using device`
   * releases on scope exit, and the release can legitimately find the
   * handle already gone. Left unhandled, JS wraps the real error in a
   * `SuppressedError` behind a `DETOX_STALE_HANDLE` nobody cares about.
   * Only that one code is swallowed; any other release failure still
   * propagates, because "I could not hand the device back" is real news.
   */
  it('lets disposal absorb a stale-handle release, and only that one', async () => {
    const stale = await withDevice();
    stale.server.onRequest('releaseDevice', () =>
      Promise.reject(
        new DetoxError('Unknown allocation: alloc-1', {
          code: DetoxErrorCode.DETOX_STALE_HANDLE,
          details: { allocationId: 'alloc-1' },
        }),
      ),
    );
    await expect(stale.device[Symbol.asyncDispose]()).resolves.toBeUndefined();
    await stale.dispose();

    const broken = await withDevice();
    broken.server.onRequest('releaseDevice', () =>
      Promise.reject(
        new DetoxError('the pool is on fire', { code: DetoxErrorCode.DETOX_INTERNAL }),
      ),
    );
    await expect(broken.device[Symbol.asyncDispose]()).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INTERNAL,
    });
    await broken.dispose();
  });
});
