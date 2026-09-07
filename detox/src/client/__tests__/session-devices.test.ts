import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  AllocateDeviceRequest,
  AllocateDeviceResponse,
  BootDeviceRequest,
  BootDeviceResponse,
  ShutdownDeviceRequest,
  ShutdownDeviceResponse,
  ReleaseDeviceRequest,
  ReleaseDeviceResponse,
} from '@detox-remote/protocol';

import { connect } from '../../client';
import type { DetoxOperationRef, DetoxProgressEvent } from '../../client';
import { FakeWebSocket, connectFakeServer } from './helpers/fake-transport';

// Same fake, and same reason for the dynamic import inside the factory, as
// session-connect.test.ts.
vi.mock('ws', async () => {
  const { FakeWebSocket: FakeWebSocketCtor } = await import('./helpers/fake-transport');
  return { default: FakeWebSocketCtor };
});

const iosResponse: AllocateDeviceResponse = {
  allocationId: 'alloc-1',
  device: { udid: 'udid-1' },
  name: 'iPhone 17',
  os: 'iOS 26.5',
  state: 'booted',
  apps: { serverUrl: 'ws://127.0.0.1:5599' },
};

interface MaybeIosDeviceInfo {
  udid?: string;
}

const androidResponse: AllocateDeviceResponse = {
  allocationId: 'alloc-android',
  device: { adbName: 'emulator-5554' },
  name: 'Pixel 7',
  os: 'Android 15',
  state: 'booted',
  apps: { serverUrl: 'ws://127.0.0.1:5599' },
};

describe('DetoxSession — device lifecycle', () => {
  beforeEach(() => {
    FakeWebSocket.created.length = 0;
  });

  /**
   * @issue DTX-3008
   * The public dialect's device query travels verbatim (spec 015): it is the
   * driver's own vocabulary — the iOS driver is what maps `model` onto
   * applesimutils' `type`, never the client.
   */
  it('allocates a device, sending the query verbatim and spreading the descriptor into info', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const server = connectFakeServer();

    let receivedRequest: AllocateDeviceRequest | undefined;
    server.onRequest<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice', async (params) => {
      receivedRequest = params;
      return iosResponse;
    });
    server.onRequest<ReleaseDeviceRequest, ReleaseDeviceResponse>('releaseDevice', async () => ({ released: true }));

    await using session = await sessionPromise;
    await using device = await session.allocateDevice({
      type: 'ios.simulator',
      device: { deviceId: 'ABCD-1234', model: 'iPhone 17', os: '17.2' },
    });

    expect(receivedRequest?.device).toEqual({ deviceId: 'ABCD-1234', model: 'iPhone 17', os: '17.2' });
    expect(device.info).toEqual({
      allocationId: 'alloc-1',
      name: 'iPhone 17',
      os: 'iOS 26.5',
      type: 'ios.simulator',
      udid: 'udid-1',
    });
    expect(device.state).toBe('booted');
  });

  it('sends no wire device query when the caller narrows nothing', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const server = connectFakeServer();

    let receivedRequest: AllocateDeviceRequest | undefined;
    server.onRequest<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice', async (params) => {
      receivedRequest = params;
      return iosResponse;
    });
    server.onRequest<ReleaseDeviceRequest, ReleaseDeviceResponse>('releaseDevice', async () => ({ released: true }));

    await using session = await sessionPromise;
    await using device = await session.allocateDevice({ type: 'ios.simulator' });

    expect(receivedRequest?.device).toBeUndefined();
    expect(device.info.type).toBe('ios.simulator');
  });

  it('narrows android device info to adbName rather than udid', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const server = connectFakeServer();
    server.onRequest<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice', async () => androidResponse);
    server.onRequest<ReleaseDeviceRequest, ReleaseDeviceResponse>('releaseDevice', async () => ({ released: true }));

    await using session = await sessionPromise;
    await using device = await session.allocateDevice({ type: 'android.emulator' });

    expect(device.info).toMatchObject({ type: 'android.emulator', adbName: 'emulator-5554' });
    expect((device.info as MaybeIosDeviceInfo).udid).toBeUndefined();
  });

  /**
   * @issue DTX-3007
   * The server attaches its push notifier just before answering
   * `allocateDevice`, so a state change in that gap arrives before the
   * client has a handle to apply it to. It is queued and replayed the
   * moment the handle is registered — without this, a push in the gap
   * would be lost forever, since the push channel is the sole writer of
   * `device.state` and the server only re-notifies on change.
   */
  it('applies a state push that arrives before the handle is registered (the early-state gap)', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const server = connectFakeServer();

    server.onRequest<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice', async () => {
      // The push lands while this handler is still running — before the
      // response (and therefore the client's handle) exists.
      server.notify('deviceStateChanged', { allocationId: iosResponse.allocationId, state: 'shutdown' });
      return iosResponse;
    });
    server.onRequest<ReleaseDeviceRequest, ReleaseDeviceResponse>('releaseDevice', async () => ({ released: true }));

    await using session = await sessionPromise;
    await using device = await session.allocateDevice({ type: 'ios.simulator' });

    // The response itself claims 'booted' — the early push must win, proving
    // it was queued and replayed rather than silently dropped.
    expect(device.state).toBe('shutdown');
  });

  /**
   * @issue DTX-3009
   * Neither `boot` nor `shutdown` writes `#state` from its own response: the
   * push channel is the sole writer after allocation. The server notifies
   * the transition before answering the request (same socket, in-order), so
   * the state is already applied when the caller's `await` returns.
   */
  it('applies a state push for an already-registered device via the ordinary path', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const server = connectFakeServer();
    server.onRequest<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice', async () => iosResponse);
    server.onRequest<ShutdownDeviceRequest, ShutdownDeviceResponse>('shutdownDevice', async () => {
      // The push always precedes the response on the real server; the
      // response's own `state` field must never be read into `device.state` —
      // proven here by disagreeing with it.
      server.notify('deviceStateChanged', { allocationId: iosResponse.allocationId, state: 'shutting-down' });
      return { state: 'shutdown' };
    });
    server.onRequest<ReleaseDeviceRequest, ReleaseDeviceResponse>('releaseDevice', async () => ({ released: true }));

    await using session = await sessionPromise;
    await using device = await session.allocateDevice({ type: 'ios.simulator' });
    expect(device.state).toBe('booted');

    await device.shutdown();
    expect(device.state).toBe('shutting-down');
  });

  it('boots, ignoring the response body and trusting only the push', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const server = connectFakeServer();
    server.onRequest<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice', async () => iosResponse);
    server.onRequest<BootDeviceRequest, BootDeviceResponse>('bootDevice', async () => {
      server.notify('deviceStateChanged', { allocationId: iosResponse.allocationId, state: 'booting' });
      return { state: 'booted' };
    });
    server.onRequest<ReleaseDeviceRequest, ReleaseDeviceResponse>('releaseDevice', async () => ({ released: true }));

    await using session = await sessionPromise;
    await using device = await session.allocateDevice({ type: 'ios.simulator' });

    await device.boot();
    expect(device.state).toBe('booting');
  });

  it('releases, tells the server, and stops the handle from being released twice', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const server = connectFakeServer();
    server.onRequest<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice', async () => iosResponse);
    let releaseCalls = 0;
    server.onRequest<ReleaseDeviceRequest, ReleaseDeviceResponse>('releaseDevice', async () => {
      releaseCalls += 1;
      return { released: true };
    });

    const session = await sessionPromise;
    const device = await session.allocateDevice({ type: 'ios.simulator' });

    await device.release();
    expect(releaseCalls).toBe(1);

    // `[Symbol.asyncDispose]` must see the release already happened and send
    // nothing a second time.
    await device[Symbol.asyncDispose]();
    expect(releaseCalls).toBe(1);

    await session.disconnect();
  });

  it('releases an un-released device through disposal', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const server = connectFakeServer();
    server.onRequest<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice', async () => iosResponse);
    let releaseCalls = 0;
    server.onRequest<ReleaseDeviceRequest, ReleaseDeviceResponse>('releaseDevice', async () => {
      releaseCalls += 1;
      return { released: true };
    });

    const session = await sessionPromise;
    const device = await session.allocateDevice({ type: 'ios.simulator' });

    await device[Symbol.asyncDispose]();
    expect(releaseCalls).toBe(1);

    await session.disconnect();
  });

  it('routes $/progress: the root operation, a server-begun child, its progress, its end, an orphaned end, and garbage', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const server = connectFakeServer();

    server.onRequest<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice', async (_params, ctx) => {
      ctx.progress({ op: 'allocateDevice', kind: 'progress', message: 'connecting to simulator' });
      ctx.progress({ op: 'boot', kind: 'begin', message: 'starting boot' });
      ctx.progress({ op: 'boot', kind: 'progress', message: 'booting' });
      // No 'release' child was ever begun — must be dropped, not throw.
      ctx.progress({ op: 'release', kind: 'end', ok: true });
      // Not shaped like OperationProgress at all — must be dropped, not throw.
      ctx.progress('a plain string, not a progress payload');
      ctx.progress({ op: 'boot', kind: 'end', ok: true });
      return iosResponse;
    });

    const operationsByName = new Map<string, DetoxOperationRef>();
    const rootProgress: DetoxProgressEvent[] = [];
    const childProgress: DetoxProgressEvent[] = [];
    const childEnds: Array<{ ok: boolean; error?: unknown }> = [];

    const session = await sessionPromise;
    session.on('operation', (op) => {
      operationsByName.set(op.name, op);
      if (op.name === 'boot') {
        op.on('progress', (event) => childProgress.push(event));
        op.on('end', (event) => childEnds.push(event.ok ? { ok: true } : { ok: false, error: event.error }));
      }
    });

    const allocateOp = session.allocateDevice({ type: 'ios.simulator' });
    void allocateOp.on('progress', (event) => rootProgress.push(event));

    await allocateOp;

    expect(rootProgress.map((e) => e.message)).toContain('connecting to simulator');
    expect(operationsByName.get('boot')?.parent?.name).toBe('allocateDevice');
    // A `begin` immediately dispatches its own message as a progress event to
    // the freshly created child (session.ts's `#routeWireProgress`), before
    // any of its own `kind: 'progress'` notifications arrive.
    expect(childProgress.map((e) => e.message)).toEqual(['starting boot', 'booting']);
    expect(childEnds).toEqual([{ ok: true }]);
  });

  it('settles a server-begun child as failed, with a message naming its operation', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const server = connectFakeServer();

    server.onRequest<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice', async (_params, ctx) => {
      ctx.progress({ op: 'shutdown', kind: 'begin' });
      ctx.progress({ op: 'shutdown', kind: 'end', ok: false });
      return iosResponse;
    });

    const session = await sessionPromise;
    let child: DetoxOperationRef | undefined;
    session.on('operation', (op) => {
      if (op.name === 'shutdown') child = op;
    });

    const ended = new Promise<{ ok: boolean; error?: unknown }>((resolve) => {
      session.on('operation', (op) => {
        if (op.name !== 'shutdown') return;
        op.on('end', (event) => resolve(event.ok ? { ok: true } : { ok: false, error: event.error }));
      });
    });

    await session.allocateDevice({ type: 'ios.simulator' });
    const outcome = await ended;

    expect(child?.name).toBe('shutdown');
    expect(outcome.ok).toBe(false);
    expect((outcome.error as Error).message).toBe('Operation "shutdown" failed on the server');
  });

  it('propagates progress from boot/shutdown/release wire calls through the device deps wrapper', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const server = connectFakeServer();
    server.onRequest<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice', async () => iosResponse);
    server.onRequest<BootDeviceRequest, BootDeviceResponse>('bootDevice', async (_params, ctx) => {
      ctx.progress({ op: 'boot', kind: 'progress', message: 'spinning up' });
      return { state: 'booted' };
    });

    const session = await sessionPromise;
    const device = await session.allocateDevice({ type: 'ios.simulator' });

    const bootOp = device.boot();
    const messages: (string | undefined)[] = [];
    void bootOp.on('progress', (event) => messages.push(event.message));
    await bootOp;

    expect(messages).toEqual(['spinning up']);
    await session.disconnect();
  });

  it('exposes the session-wide operation channel and lets a listener unsubscribe', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const server = connectFakeServer();
    server.onRequest<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice', async () => iosResponse);

    const session = await sessionPromise;
    const seen: string[] = [];
    const listener = (op: DetoxOperationRef) => seen.push(op.name);

    session.on('operation', listener);
    await session.allocateDevice({ type: 'ios.simulator' });
    expect(seen).toEqual(['allocateDevice']);

    session.off('operation', listener);
    await session.allocateDevice({ type: 'ios.simulator' });
    // Unsubscribed — the second allocation must not have been reported.
    expect(seen).toEqual(['allocateDevice']);

    await session.disconnect();
  });

  it('disconnect() is a no-op with nothing allocated, and idempotent', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    connectFakeServer();

    const session = await sessionPromise;
    await session.disconnect();
    await session.disconnect(); // second call must not re-close or throw
  });

  /**
   * @issue DTX-3011
   * The server reclaims everything a connection held the moment it drops, so
   * a courteous per-device release pass before closing would buy nothing but
   * a clock. `disconnect()` closes without a single `releaseDevice` frame,
   * and without waiting on anything.
   *
   * @issue DTX-3010
   * `disconnect()` memoizes the close, so a second concurrent call awaits the
   * same promise instead of resolving early while the socket is still open.
   *
   * @issue DTX-3012
   * The connection close releases every device server-side, and handles must
   * learn that: a still-in-scope `await using device` disposing after
   * teardown must not go asking a closed peer for a release and surface
   * `DETOX_CONNECTION_LOST` over the test's own outcome.
   */
  it('disconnect() sends no per-device release — the connection close IS the cleanup', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const server = connectFakeServer();
    server.onRequest<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice', async () => iosResponse);
    const released: string[] = [];
    server.onRequest<ReleaseDeviceRequest, ReleaseDeviceResponse>('releaseDevice', async (params) => {
      released.push(params.allocationId);
      return { released: true };
    });

    const session = await sessionPromise;
    const device = await session.allocateDevice({ type: 'ios.simulator' });

    await Promise.all([session.disconnect(), session.disconnect()]);

    expect(released).toEqual([]);
    expect(FakeWebSocket.created.at(-1)!.readyState).toBe(3);
    await expect(device[Symbol.asyncDispose]()).resolves.toBeUndefined();
  });

  it('[Symbol.asyncDispose] on the session delegates to disconnect()', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    connectFakeServer();

    const session = await sessionPromise;
    await session[Symbol.asyncDispose]();

    const socket = FakeWebSocket.created.at(-1)!;
    expect(socket.readyState).toBe(3);
  });

  it('disconnects on its own when the session signal aborts', async () => {
    const controller = new AbortController();
    const sessionPromise = connect({ server: 'ws://fake-host/detox', signal: controller.signal });
    connectFakeServer();

    const session = await sessionPromise;
    const socket = FakeWebSocket.created.at(-1)!;
    expect(socket.readyState).toBe(1);

    controller.abort(new Error('caller is done'));
    // `disconnect()` is fired-and-forgotten from the abort listener.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(socket.readyState).toBe(3);
    await session.disconnect(); // already disconnected — must stay a no-op
  });

  it('rejects a device operation aborted mid-flight, via the cancel-request handshake', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const server = connectFakeServer();
    server.onRequest<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice', async () => iosResponse);
    let bootReachedServer = false;
    server.onRequest<BootDeviceRequest, BootDeviceResponse>('bootDevice', async (_params, ctx) => {
      bootReachedServer = true;
      // Hangs until the client's `$/cancelRequest` aborts this handler's own
      // signal — the real server's equivalent of "stop what you're doing".
      await new Promise<void>((_resolve, reject) => {
        ctx.signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
      });
      return { state: 'booted' };
    });

    const session = await sessionPromise;
    const device = await session.allocateDevice({ type: 'ios.simulator' });

    const controller = new AbortController();
    const bootOp = device.boot({ signal: controller.signal });
    controller.abort(new Error('caller cancelled the boot'));

    await expect(bootOp).rejects.toMatchObject({ name: 'AbortError' });
    expect(bootReachedServer).toBe(true);
    await session.disconnect();
  });
});
