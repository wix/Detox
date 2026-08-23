/**
 * AbortSignal hygiene, wire half (spec 010's integration-gated contract):
 * driven through the real jest environment adopting a real compat session
 * over the fake transport, so what is asserted is the frame the v21 server
 * would actually see — a pending compat call at unit failure settles via a
 * real `$/cancelRequest` (the server-side handler's ctx.signal aborts; the
 * fake transport carries genuine Peer frames, so that abort has exactly one
 * possible source), never by socket death. Plus the composition rules:
 * an explicit per-call signal and the ambient scope each abort the call.
 */
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DetoxError, DetoxErrorCode } from 'detox/internals';

import { cleanup, device, init, type CompatConfig } from '../index';
import { compatStateBox } from '../state';
import { DetoxCircusEnvironment } from '../jest/environment';
import {
  FakeWebSocket,
  connectFakeServer,
  type FakeServer,
} from '../../../../detox/src/internals/__tests__/helpers/fake-transport';

vi.mock('ws', async () => {
  const { FakeWebSocket: FakeWebSocketCtor } = await import(
    '../../../../detox/src/internals/__tests__/helpers/fake-transport'
  );
  return { default: FakeWebSocketCtor };
});

const allocation = {
  allocationId: 'alloc-1',
  device: { udid: 'udid-1' },
  name: 'iPhone 17',
  os: 'iOS 26.5',
  state: 'booted',
};

const box = compatStateBox();

async function initCompat(overrides: Partial<CompatConfig> = {}): Promise<FakeServer> {
  const initPromise = init({
    server: { url: 'ws://fake' },
    apps: [{ name: 'app', bundleId: 'com.example.app' }],
    ...overrides,
  });
  const server = connectFakeServer();
  server.onRequest('allocateDevice', async () => allocation);
  await initPromise;
  return server;
}

function writeSnapshotFixture(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'detox-jest-hygiene-'));
  const file = path.join(dir, 'config-snapshot.json');
  writeFileSync(
    file,
    JSON.stringify({
      configurationName: 'ios.sim',
      client: { server: 'ws://fake' },
      apps: [{ name: 'app', bundleId: 'com.example.app' }],
      device: { type: 'ios.simulator', query: {} },
    }),
  );
  return file;
}

function makeEnvironment(): DetoxCircusEnvironment {
  return new DetoxCircusEnvironment(
    {
      globalConfig: {} as never,
      projectConfig: { testEnvironmentOptions: {} } as never,
    },
    { console, docblockPragmas: {}, testPath: '/tmp/hygiene.test.js' },
  );
}

const dispatch = (env: DetoxCircusEnvironment, name: string): void => {
  (env.handleTestEvent as (event: unknown, state: unknown) => void)(
    { name },
    { currentDescribeBlock: { children: [{}] } },
  );
};

/**
 * Parks a request server-side until a `$/cancelRequest` aborts its ctx —
 * then unwinds like a real handler does (threads `ctx.signal`, rejects), so
 * the responder can answer `-32800` and the requester settles. A handler
 * that ignores its signal would park the caller forever — the caller
 * settles on the responder's word.
 */
interface ParkedRequest {
  sawCancel: Promise<void>;
}

interface CtxWithSignal {
  signal: AbortSignal;
}

function parkRequest(server: FakeServer, method: string): ParkedRequest {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  server.onRequest(method, (_params, ctx) => {
    const signal = (ctx as CtxWithSignal).signal;
    return new Promise((_never, reject) => {
      signal.addEventListener(
        'abort',
        () => {
          resolve();
          reject(signal.reason instanceof Error ? signal.reason : new Error('aborted'));
        },
        { once: true },
      );
    });
  });
  return { sawCancel: promise };
}

const savedEnv = process.env.DETOX_CONFIG_SNAPSHOT_PATH;

beforeEach(() => {
  FakeWebSocket.created.length = 0;
  process.env.DETOX_CONFIG_SNAPSHOT_PATH = writeSnapshotFixture();
});

afterEach(async () => {
  if (savedEnv === undefined) delete process.env.DETOX_CONFIG_SNAPSHOT_PATH;
  else process.env.DETOX_CONFIG_SNAPSHOT_PATH = savedEnv;
  box.ambient = undefined;
  box.unrefSocket = false;
  await cleanup();
});

describe('unit failure cancels the stray call through the real machinery', () => {
  it('a pending call at test failure settles ABORTED via $/cancelRequest, not socket death', async () => {
    const server = await initCompat();
    const env = makeEnvironment();
    await env.setup(); // adopts the live session — box.state is set
    try {
      const { sawCancel } = parkRequest(server, 'sendToHome');
      dispatch(env, 'test_fn_start');
      const stray = device.sendToHome();
      dispatch(env, 'test_fn_failure');
      await expect(stray).rejects.toMatchObject({ name: 'AbortError' });
      // The server-side handler's ctx aborted: on this transport the only
      // path there is a $/cancelRequest frame — the socket never closed
      // (the next assertion proves the session is still alive).
      await sawCancel;
      dispatch(env, 'test_fn_start');
      server.onRequest('setLocation', async () => null);
      await expect(device.setLocation(1, 2)).resolves.toBeUndefined();
    } finally {
      await env.teardown();
    }
  });

  it('a PASSING unit aborts nothing; environment teardown aborts the file scope', async () => {
    const server = await initCompat();
    const env = makeEnvironment();
    await env.setup();
    const { sawCancel } = parkRequest(server, 'sendToHome');
    dispatch(env, 'test_fn_start');
    const leftover = device.sendToHome();
    leftover.catch(() => undefined);
    dispatch(env, 'test_done');
    // The passing test's leftover is not touched at the unit boundary…
    let settled = false;
    leftover.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(settled).toBe(false);
    // …and dies with the file, unconditionally.
    await env.teardown();
    await expect(leftover).rejects.toMatchObject({ name: 'AbortError' });
    await sawCancel;
  });
});

describe('the worker-exit obligations', () => {
  it('init under the environment UNREFS the socket — an idle session cannot hold a worker open', async () => {
    // The environment sets box.unrefSocket before init; the client must then
    // actually unref the underlying net socket at connect. The fake carries
    // a spy where ws keeps its net.Socket.
    box.unrefSocket = true;
    const unref = vi.fn();
    const initPromise = init({
      server: { url: 'ws://fake' },
      apps: [{ name: 'app', bundleId: 'com.example.app' }],
    });
    const socket = FakeWebSocket.created.at(-1) as FakeWebSocket & {
      _socket?: { unref: () => void };
    };
    socket._socket = { unref };
    const server = connectFakeServer();
    server.onRequest('allocateDevice', async () => allocation);
    await initPromise;
    expect(unref).toHaveBeenCalledTimes(1);
  });

  it('a refused allocation (pool exhausted) fails the FILE through env.setup, typed and retryable', async () => {
    // Through the environment: setup runs the init itself; the refusal must
    // surface as the file's failure with the code name stamped, and leave
    // the box empty so the next file's setup retries on its own terms.
    const env = makeEnvironment();
    const setupPromise = env.setup();
    setupPromise.catch(() => undefined);
    // env.setup → super.setup → loadSnapshot → compat.init constructs the
    // socket; poll for it rather than assume the microtask count.
    for (let i = 0; i < 200 && FakeWebSocket.created.length === 0; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    const server = connectFakeServer();
    server.onRequest('allocateDevice', async () => {
      // The frozen 002/004 refusal, thrown server-side so it travels the wire.
      throw new DetoxError('Every simulator matching the query is busy', {
        code: DetoxErrorCode.DETOX_POOL_EXHAUSTED,
      });
    });
    await expect(setupPromise).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_POOL_EXHAUSTED,
      message: expect.stringContaining('DETOX_POOL_EXHAUSTED') as unknown as string,
    });
    expect(box.state).toBeUndefined();
    expect(box.pendingInit).toBeUndefined();
    await env.teardown();
  });
});

describe('scope ↔ explicit-signal composition (either aborts the call)', () => {
  it('an explicit per-call signal still aborts under a live ambient scope', async () => {
    const server = await initCompat();
    const env = makeEnvironment();
    await env.setup();
    try {
      parkRequest(server, 'sendToHome');
      dispatch(env, 'test_fn_start');
      const explicit = new AbortController();
      const call = device.sendToHome(explicit.signal);
      explicit.abort(new Error('caller changed its mind'));
      await expect(call).rejects.toMatchObject({ name: 'AbortError' });
    } finally {
      await env.teardown();
    }
  });

  it('the ambient scope aborts a call that carried its own (unfired) signal', async () => {
    const server = await initCompat();
    const env = makeEnvironment();
    await env.setup();
    try {
      const { sawCancel } = parkRequest(server, 'sendToHome');
      dispatch(env, 'test_fn_start');
      const explicit = new AbortController();
      const call = device.sendToHome(explicit.signal);
      dispatch(env, 'test_fn_failure');
      await expect(call).rejects.toMatchObject({ name: 'AbortError' });
      await sawCancel;
    } finally {
      await env.teardown();
    }
  });
});
