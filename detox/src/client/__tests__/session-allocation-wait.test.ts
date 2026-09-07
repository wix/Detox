import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  AllocateDeviceRequest,
  AllocateDeviceResponse,
  ReleaseDeviceRequest,
  ReleaseDeviceResponse,
} from '@detox-remote/protocol';

import { connect, DetoxError, DetoxErrorCode } from '../../client';
import { FakeWebSocket, connectFakeServer } from './helpers/fake-transport';

// Same fake, and same reason for the dynamic import inside the factory, as
// session-devices.test.ts.
vi.mock('ws', async () => {
  const { FakeWebSocket: FakeWebSocketCtor } = await import('./helpers/fake-transport');
  return { default: FakeWebSocketCtor };
});

const response: AllocateDeviceResponse = {
  allocationId: 'alloc-1',
  device: { udid: 'udid-1' },
  name: 'iPhone 17',
  os: 'iOS 26.5',
  state: 'booted',
  apps: { serverUrl: 'ws://127.0.0.1:5599' },
};

const exhausted = (): DetoxError =>
  new DetoxError('every device is held', {
    code: DetoxErrorCode.DETOX_POOL_EXHAUSTED,
    details: { maxPool: 1 },
  });

/**
 * The waiting allocation (spec 018), on a fake wire so the whole suite costs
 * milliseconds. The poll period is 5s and deliberately not a knob — these
 * tests stay fast because the last sleep is trimmed to the window, so a
 * 60ms window buys exactly one retry, on the deadline.
 */
describe('DetoxSession — waiting for a device', () => {
  beforeEach(() => {
    FakeWebSocket.created.length = 0;
  });

  interface Served {
    attempts: () => number;
  }

  /** Counts attempts and answers each one from `outcomes`, last entry repeating. */
  function serve(outcomes: readonly ('exhausted' | 'ok' | 'terminal')[]): Served {
    const server = connectFakeServer();
    let attempts = 0;
    server.onRequest<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice', async () => {
      const outcome = outcomes[Math.min(attempts, outcomes.length - 1)];
      attempts += 1;
      if (outcome === 'ok') return response;
      if (outcome === 'terminal') {
        throw new DetoxError('no such device anywhere', {
          code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE,
        });
      }
      throw exhausted();
    });
    server.onRequest<ReleaseDeviceRequest, ReleaseDeviceResponse>('releaseDevice', async () => ({
      released: true,
    }));
    return { attempts: () => attempts };
  }

  it('without a window, refuses on the first attempt and adds nothing to the error', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox' });
    const served = serve(['exhausted']);
    await using session = await sessionPromise;

    const err = await session.allocateDevice({ type: 'ios.simulator' }).catch((e: unknown) => e);

    expect((err as DetoxError).name).toBe('DevicePoolExhaustedError');
    expect((err as DetoxError).details).toEqual({ maxPool: 1 });
    expect(served.attempts()).toBe(1);
  });

  it('with a window, keeps asking and reports what it waited', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox', allocationTimeout: 60 });
    const served = serve(['exhausted']);
    await using session = await sessionPromise;

    const err = (await session
      .allocateDevice({ type: 'ios.simulator' })
      .catch((e: unknown) => e)) as DetoxError;

    expect(err.name).toBe('DevicePoolExhaustedError');
    expect(err.code).toBe(DetoxErrorCode.DETOX_POOL_EXHAUSTED);
    // The server's own details survive; the wait is added to them.
    expect(err.details?.maxPool).toBe(1);
    expect(err.details?.waitedMs).toBeGreaterThanOrEqual(60);
    expect(served.attempts()).toBeGreaterThan(1);
  });

  it('takes the device the moment one frees up, without sleeping out a whole poll', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox', allocationTimeout: 60 });
    const served = serve(['exhausted', 'ok']);
    await using session = await sessionPromise;

    const startedAt = Date.now();
    await using device = await session.allocateDevice({ type: 'ios.simulator' });

    expect(device.info.udid).toBe('udid-1');
    expect(served.attempts()).toBe(2);
    // 1s, not 60ms: the slack is for CI, not for the poll.
    expect(Date.now() - startedAt).toBeLessThan(1_000);
  });

  it('an abort during the wait is Detox\'s own AbortError, not the timer\'s', async () => {
    const controller = new AbortController();
    const sessionPromise = connect({ server: 'ws://fake-host/detox', allocationTimeout: 60_000 });
    serve(['exhausted']);
    await using session = await sessionPromise;

    const pending = session
      .allocateDevice({ type: 'ios.simulator', signal: controller.signal })
      .catch((e: unknown) => e);
    // Long enough for the first attempt to be refused and the sleep to begin.
    await new Promise((resolve) => setTimeout(resolve, 20));
    controller.abort();

    const err = (await pending) as DetoxError;
    expect(err.name).toBe('AbortError');
    // The taxonomy's numeric code, never node's string `ABORT_ERR`.
    expect(err.code).toBe(DetoxErrorCode.DETOX_ABORTED);
  });

  it('refuses a window that is not a positive number of milliseconds', async () => {
    await expect(connect({ server: 'ws://fake-host/detox', allocationTimeout: 0 })).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
    });
    await expect(
      connect({ server: 'ws://fake-host/detox', allocationTimeout: -5 }),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    await expect(
      // The shape an untyped JS caller reaches for.
      connect({ server: 'ws://fake-host/detox', allocationTimeout: '10s' as unknown as number }),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
  });

  it('never waits out a terminal refusal, however wide the window', async () => {
    const sessionPromise = connect({ server: 'ws://fake-host/detox', allocationTimeout: 60_000 });
    const served = serve(['terminal']);
    await using session = await sessionPromise;

    const err = (await session
      .allocateDevice({ type: 'ios.simulator' })
      .catch((e: unknown) => e)) as DetoxError;

    expect(err.code).toBe(DetoxErrorCode.DETOX_NO_MATCHING_DEVICE);
    expect(served.attempts()).toBe(1);
  });
});
