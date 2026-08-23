/**
 * Spec 006 server-side, unit-gated where the accept suite cannot reach:
 * validation ORDER (a refusal precedes terminate-first), the version-skew
 * refusals, the deadline's zero branch (no timer is ever armed), payload
 * temp-file lifetime on every death route, the `delayPayload` mapping, and
 * the foreground/state-wait relays over a REAL gateway.
 *
 * Harness shape is app-gateway.test.ts's: the gateway is real (loopback
 * listener), simctl is faked, the "app" is a plain WebSocket speaking the
 * frozen dialect.
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { describe, it, expect, afterEach, vi } from 'vitest';
import type { DeviceInfo, InvokeResult } from '@detox-remote/protocol';
import { DetoxError, DetoxErrorCode } from '@detox-remote/core';

import { AppGateway } from '../AppGateway';
import { DetoxServerImpl } from '../DetoxServerImpl';
import { DevicePool } from '../DevicePool';
import type { DetoxServerPeer } from '../DetoxServerPeer';
import type {
  LaunchAppArgs,
  ResumeAppArgs,
  SetAppPermissionsArgs,
  SimulatorOps,
  TerminateAppArgs,
} from '../SimulatorOps';

type UndoFn = () => void | Promise<void>;

interface HandlerCtx {
  signal?: AbortSignal;
  progress?: (value: unknown) => void;
  onUndo?: (fn: UndoFn) => void;
}

type Handler<P, R> = (params: P, ctx: HandlerCtx) => Promise<R>;

interface Frame {
  type: string;
  messageId: number;
  params?: Record<string, unknown>;
}

interface FakeApp {
  received: Frame[];
  send(frame: Frame): void;
  waitFor(predicate: (frame: Frame) => boolean): Promise<Frame>;
  close(): void;
  closed: Promise<void>;
}

function dialApp(
  url: string,
  sessionId: string,
  { markReady = true }: { markReady?: boolean } = {},
): FakeApp {
  const ws = new WebSocket(url);
  const received: Frame[] = [];
  const waiters: Array<{ predicate: (frame: Frame) => boolean; resolve: (frame: Frame) => void }> = [];
  let closeResolve!: () => void;
  const closed = new Promise<void>((resolve) => {
    closeResolve = resolve;
  });
  const send = (frame: Frame): void => {
    ws.send(JSON.stringify(frame));
  };
  ws.addEventListener('open', () => {
    send({ type: 'login', messageId: 0, params: { sessionId, role: 'app' } });
  });
  const handleMessage = async (data: unknown): Promise<void> => {
    const text =
      typeof data === 'string'
        ? data
        : data instanceof ArrayBuffer
          ? new TextDecoder().decode(data)
          : await (data as Blob).text();
    const frame = JSON.parse(text) as Frame;
    received.push(frame);
    if (markReady && frame.type === 'isReady') send({ type: 'ready', messageId: -1000 });
    const at = waiters.findIndex((waiter) => waiter.predicate(frame));
    if (at >= 0) waiters.splice(at, 1)[0].resolve(frame);
  };
  ws.addEventListener('message', (event) => {
    void handleMessage(event.data as unknown);
  });
  ws.addEventListener('close', () => closeResolve());
  return {
    received,
    send,
    waitFor: (predicate) => {
      const hit = received.find(predicate);
      if (hit) return Promise.resolve(hit);
      return new Promise((resolve) => waiters.push({ predicate, resolve }));
    },
    close: () => ws.close(),
    closed,
  };
}

interface CapturedPeer {
  peer: DetoxServerPeer;
  handlers: Map<string, Handler<never, unknown>>;
}

function capturingPeer(): CapturedPeer {
  const handlers = new Map<string, Handler<never, unknown>>();
  const peer = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (prop.startsWith('on')) {
          const key = prop[2].toLowerCase() + prop.slice(3);
          return (handler: Handler<never, unknown>) => handlers.set(key, handler);
        }
        return () => {};
      },
    },
  ) as DetoxServerPeer;
  return { peer, handlers };
}

/** Same contract Peer gives a handler — the undo ledger unwinds on failure. */
function call<P, R>(handlers: Map<string, Handler<never, unknown>>, key: string): Handler<P, R> {
  return async (params, ctx) => {
    const handler = handlers.get(key);
    if (!handler) throw new Error(`${key} handler was never registered`);
    const undo: UndoFn[] = [];
    try {
      return (await handler(params as never, { ...ctx, onUndo: (fn: UndoFn) => undo.push(fn) })) as R;
    } catch (err) {
      for (let i = undo.length - 1; i >= 0; i--) {
        try {
          await undo[i]();
        } catch {
          /* the peer reports throwing compensations; irrelevant here */
        }
      }
      throw err;
    }
  };
}

interface AllocateResponse {
  allocationId: string;
  device: { udid: string };
}

interface LaunchResponse {
  pid: number;
  appHandleId: string;
}

const gateways: AppGateway[] = [];
afterEach(async () => {
  for (const gateway of gateways.splice(0)) {
    await gateway.close().catch(() => undefined);
  }
  vi.restoreAllMocks();
});

interface ServerOptions {
  onLaunch?: (gatewayUrl: string, bundleId: string) => void;
  onTerminate?: (args: TerminateAppArgs) => unknown;
  /** Awaited inside the fake `simctl erase` — for the erase-barrier test. */
  eraseGate?: Promise<void>;
  launchReadyTimeoutMs?: number;
  /** Warm handoff: the launch handshake keeps its terminate-first step. */
  alreadyBooted?: boolean;
  /** Overrides the fake framework resolution — for the missing-framework refusal test. */
  resolveFramework?: () => Promise<string>;
}

async function makeServer(options: ServerOptions = {}) {
  const gateway = await AppGateway.listen();
  gateways.push(gateway);
  const devices: DeviceInfo[] = [
    { name: 'iPhone 17', udid: 'udid-1', state: 'Shutdown', os: { platform: 'iOS' } },
  ] as DeviceInfo[];
  const trace: string[] = [];
  const launches: LaunchAppArgs[] = [];
  const resumes: ResumeAppArgs[] = [];
  const permissionWrites: SetAppPermissionsArgs[] = [];
  const simulatorOps = {
    list: async () => devices,
    boot: async () => !options.alreadyBooted,
    shutdown: async () => true,
    terminate: async (args: TerminateAppArgs) => {
      trace.push(`terminate:${args.bundleId}`);
      await options.onTerminate?.(args);
    },
    resolveFrameworkPath: async () =>
      options.resolveFramework ? options.resolveFramework() : '/fake/Detox.framework/Detox',
    launch: async (args: LaunchAppArgs) => {
      trace.push(`launch:${args.bundleId}`);
      launches.push(args);
      options.onLaunch?.(args.detox?.serverUrl ?? gateway.url, args.bundleId);
      return 4242;
    },
    resume: async (args: ResumeAppArgs) => {
      trace.push(`resume:${args.bundleId}`);
      resumes.push(args);
    },
    erase: async () => {
      trace.push('erase');
      if (options.eraseGate) await options.eraseGate;
    },
    sendToHome: async () => {
      trace.push('sendToHome');
    },
    setPermissions: async (args: SetAppPermissionsArgs) => {
      permissionWrites.push(args);
    },
  } as unknown as SimulatorOps;
  const devicePool = new DevicePool({ simulatorOps, maxPool: 4 });
  const captured = capturingPeer();
  const impl = new DetoxServerImpl({
    serverPeer: captured.peer,
    devicePool,
    simulatorOps,
    appGateway: gateway,
    config: { launchReadyTimeoutMs: options.launchReadyTimeoutMs },
  });
  void impl;
  return {
    gateway,
    trace,
    launches,
    resumes,
    permissionWrites,
    allocate: call<{ type: string }, AllocateResponse>(captured.handlers, 'allocateDevice'),
    launchApp: call<Record<string, unknown>, LaunchResponse>(captured.handlers, 'launchApp'),
    terminateApp: call<Record<string, unknown>, void>(captured.handlers, 'terminateApp'),
    release: call<{ allocationId: string }, { released: boolean }>(captured.handlers, 'releaseDevice'),
    setPermissions: call<Record<string, unknown>, void>(captured.handlers, 'setPermissions'),
    sendToHome: call<Record<string, unknown>, void>(captured.handlers, 'sendToHome'),
    resetContentAndSettings: call<Record<string, unknown>, void>(
      captured.handlers,
      'resetContentAndSettings',
    ),
    foregroundApp: call<Record<string, unknown>, void>(captured.handlers, 'foregroundApp'),
    waitForActive: call<Record<string, unknown>, void>(captured.handlers, 'waitForActive'),
    waitForBackground: call<Record<string, unknown>, void>(captured.handlers, 'waitForBackground'),
    deliverPayload: call<Record<string, unknown>, void>(captured.handlers, 'deliverPayload'),
    setSyncSettings: call<Record<string, unknown>, void>(captured.handlers, 'setSyncSettings'),
    invoke: call<Record<string, unknown>, InvokeResult>(captured.handlers, 'invoke'),
  };
}

/** Allocates and launches one ready app, returning its address and fake side. */
async function withLaunchedApp(options: ServerOptions = {}) {
  let app!: FakeApp;
  const server = await makeServer({
    ...options,
    onLaunch: (url, bundleId) => {
      app = dialApp(url, bundleId);
      options.onLaunch?.(url, bundleId);
    },
  });
  const allocation = await server.allocate({ type: 'ios.simulator' }, {});
  const launched = await server.launchApp(
    { allocationId: allocation.allocationId, appId: 'com.example.app' },
    {},
  );
  return { ...server, allocation, launched, app };
}

describe('launch validation precedes every side effect', () => {
  /**
   * @issue DTX-2012
   * The earlier draft's `newInstance` / `permissions` / `delete` fields are
   * dead: a client still sending them is a version skew, refused typed and
   * named, never silently dropped or acted on.
   */
  it('refuses the version-skewed dead fields, naming the skew, touching nothing', async () => {
    const server = await makeServer({ alreadyBooted: true });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    for (const dead of [{ newInstance: true }, { permissions: { camera: 'YES' } }, { delete: true }]) {
      await expect(
        server.launchApp({ allocationId: allocation.allocationId, appId: 'com.example.app', ...dead }, {}),
      ).rejects.toMatchObject({
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { versionSkew: true },
      });
    }
    expect(server.trace).toEqual([]);
  });

  /**
   * @issue DTX-6022
   * The framework resolves under the same before-any-side-effect rule:
   * a launch that cannot be instrumented must refuse before payload
   * files hit the disk, before terminate-first can kill a running instance,
   * and before `cleanBoot` is forfeited.
   */
  it('refuses a missing Detox framework BEFORE terminate-first can run', async () => {
    // A warm handoff, so a launch past the refusal WOULD terminate the live
    // app — the empty trace is the proof the refusal cost the caller nothing.
    const server = await makeServer({
      alreadyBooted: true,
      resolveFramework: async () => {
        throw new DetoxError('the Detox framework is not on this server', {
          code: DetoxErrorCode.DETOX_INTERNAL,
          details: { frameworkCacheDir: '/nowhere' },
        });
      },
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    await expect(
      server.launchApp(
        // A payload rides along: the refusal must precede its materialization
        // too, not just terminate-first (same ordering rule).
        { allocationId: allocation.allocationId, appId: 'com.example.app', userNotification: { a: 1 } },
        {},
      ),
    ).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INTERNAL,
      details: { frameworkCacheDir: '/nowhere' },
    });
    expect(server.trace).toEqual([]);
  });

  it('refuses each reserved launch-arg key BEFORE terminate-first can run', async () => {
    // A warm handoff, so a launch that got past validation WOULD terminate.
    const server = await makeServer({ alreadyBooted: true });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    for (const key of [
      'detoxServer',
      'detoxSessionId',
      'detoxUserNotificationDataURL',
      'detoxUserActivityDataURL',
    ]) {
      await expect(
        server.launchApp(
          {
            allocationId: allocation.allocationId,
            appId: 'com.example.app',
            launchArgs: { [key]: 'ws://evil.example:1' },
          },
          {},
        ),
      ).rejects.toMatchObject({
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { parameter: key },
      });
    }
    expect(server.trace).toEqual([]);
  });

  /**
   * @issue DTX-6026
   * The payload trio's shared rules (spec 006), used by both the at-launch
   * options and live delivery: mutual exclusivity is presence-based, not
   * truthiness-based — v20 silently ignored `url: ''`, so an empty url is
   * its own refusal here — and `sourceApp` only means anything next to `url`.
   */
  it('payload rules: presence-based exclusivity, empty url, orphaned sourceApp', async () => {
    const server = await makeServer({ alreadyBooted: true });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const address = { allocationId: allocation.allocationId, appId: 'com.example.app' };
    await expect(
      server.launchApp({ ...address, url: 'scheme://x', userNotification: { a: 1 } }, {}),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    await expect(server.launchApp({ ...address, url: '' }, {})).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { parameter: 'url' },
    });
    await expect(
      server.launchApp({ ...address, sourceApp: 'com.example.src' }, {}),
    ).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { parameter: 'sourceApp' },
    });
    await expect(server.launchApp({ ...address, deadlineMs: -5 }, {})).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { parameter: 'deadlineMs' },
    });
    expect(server.trace).toEqual([]);
  });

  /**
   * @issue DTX-6025
   * `deadlineMs` must be an integer <= 2^31-1, matching what the clock can
   * actually honour: `AbortSignal.timeout(0.5)` throws a raw RangeError, and
   * node silently clamps 2^31..2^32-1 to ~1 ms — 25 days of declared
   * patience would fail the launch instantly with the app blamed.
   */
  it('deadlineMs is refused outside what the clock can honour — fractions and past 2^31-1', async () => {
    const server = await makeServer({ alreadyBooted: true });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const address = { allocationId: allocation.allocationId, appId: 'com.example.app' };
    for (const deadlineMs of [0.5, 2 ** 31, Number.MAX_SAFE_INTEGER]) {
      await expect(server.launchApp({ ...address, deadlineMs }, {})).rejects.toMatchObject({
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { parameter: 'deadlineMs' },
      });
    }
    expect(server.trace).toEqual([]);
  });

  it('a flag-shaped launchArgs KEY is refused — it would compose a --flag argv token', async () => {
    const server = await makeServer({ alreadyBooted: true });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    await expect(
      server.launchApp(
        {
          allocationId: allocation.allocationId,
          appId: 'com.example.app',
          launchArgs: { '-stdout': '/tmp/x' },
        },
        {},
      ),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    expect(server.trace).toEqual([]);
  });

  /**
   * @issue DTX-6027
   * Shape, not just presence: the frozen native reads the materialized file
   * expecting a dictionary, so a string or array from a hostile-but-typed
   * caller would crash the app the gateway protects. A whitespace-bearing
   * url would fatalError the app-side URL parser the same way — a typed
   * refusal here beats an app crash blamed on 2013.
   */
  it('payload values must be JSON objects — the frozen native force-casts a dictionary', async () => {
    const server = await makeServer({ alreadyBooted: true });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const address = { allocationId: allocation.allocationId, appId: 'com.example.app' };
    for (const bad of ['a string', [1, 2, 3], 42, null]) {
      await expect(
        server.launchApp({ ...address, userNotification: bad }, {}),
      ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    }
    await expect(
      server.launchApp({ ...address, url: 'scheme://x y' }, {}),
    ).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { parameter: 'url' },
    });
    expect(server.trace).toEqual([]);
  });
});

describe('the launch deadline is the caller’s (spec 006)', () => {
  it('a caller deadline governs instead of the server default', async () => {
    // The app never connects; the server default here is generous, so only
    // the caller's number can explain a fast typed failure.
    const server = await makeServer({ launchReadyTimeoutMs: 60_000 });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const startedAt = Date.now();
    await expect(
      server.launchApp(
        { allocationId: allocation.allocationId, appId: 'com.example.app', deadlineMs: 200 },
        {},
      ),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_APP_DIED });
    expect(Date.now() - startedAt).toBeLessThan(30_000);
  });

  /**
   * @issue DTX-6023
   * `0` is a branch, not a value: `AbortSignal.timeout(0)` fires
   * immediately, and 0 means no server deadline — the caller's signal is
   * the only exit.
   */
  it('deadlineMs: 0 arms NO server clock — AbortSignal.timeout is never constructed', async () => {
    const server = await makeServer();
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');

    // The app never connects and there is no deadline: the caller's signal is
    // the only exit, and it is honoured as the abort it is — not a verdict.
    const controller = new AbortController();
    const pending = server.launchApp(
      { allocationId: allocation.allocationId, appId: 'com.example.app', deadlineMs: 0 },
      { signal: controller.signal },
    );
    setTimeout(() => controller.abort(new Error('walked away')), 100);
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(timeoutSpy).not.toHaveBeenCalled();
  });
});

/**
 * @issue DTX-6021
 * Payload values materialize to the server's own files (the path on argv
 * is server-minted by construction, and the value never rides as a client
 * path). Registered on the undo ledger before anything physical, so a
 * launch that fails or is cancelled owes the disk its files back; once the
 * launch succeeds, the files' lifetime becomes the handle's — terminate,
 * supersede, release, or a late rollback all end in a dead session, and
 * either cleanup route is idempotent so meeting twice is harmless.
 */
describe('at-launch payloads materialize server-side and die with the handle', () => {
  const VALUE = { trigger: { type: 'push' }, note: 'a value, not a path' };

  async function launchedWithPayload(options: ServerOptions = {}) {
    let app!: FakeApp;
    const server = await makeServer({
      ...options,
      onLaunch: (url, bundleId) => {
        app = dialApp(url, bundleId);
      },
    });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const launched = await server.launchApp(
      {
        allocationId: allocation.allocationId,
        appId: 'com.example.app',
        userNotification: VALUE,
      },
      {},
    );
    const payloadPath = server.launches[0].payloadArgs?.detoxUserNotificationDataURL as string;
    return { ...server, allocation, launched, app: app, payloadPath };
  }

  it('the argv path is server-minted and the file holds the exact value', async () => {
    const fixture = await launchedWithPayload();
    expect(fixture.payloadPath).toMatch(/^\//);
    expect(JSON.parse(await readFile(fixture.payloadPath, 'utf8'))).toEqual(VALUE);
    // The userActivity twin rides its own key.
    const second = await makeServer({
      onLaunch: (url, bundleId) => void dialApp(url, bundleId),
    });
    const allocation = await second.allocate({ type: 'ios.simulator' }, {});
    await second.launchApp(
      { allocationId: allocation.allocationId, appId: 'com.example.app', userActivity: { k: 1 } },
      {},
    );
    expect(second.launches[0].payloadArgs?.detoxUserActivityDataURL).toMatch(/^\//);
    // And the url form composes both argv overrides with no file at all.
    const third = await makeServer({
      onLaunch: (url, bundleId) => void dialApp(url, bundleId),
    });
    const thirdAllocation = await third.allocate({ type: 'ios.simulator' }, {});
    await third.launchApp(
      {
        allocationId: thirdAllocation.allocationId,
        appId: 'com.example.app',
        url: 'scheme://x?a=b',
        sourceApp: 'com.example.src',
      },
      {},
    );
    expect(third.launches[0].payloadArgs).toEqual({
      detoxURLOverride: 'scheme://x?a=b',
      detoxSourceAppOverride: 'com.example.src',
    });
  });

  it('terminate (by handle) removes the payload file', async () => {
    const fixture = await launchedWithPayload();
    await fixture.terminateApp(
      {
        allocationId: fixture.allocation.allocationId,
        appId: 'com.example.app',
        appHandleId: fixture.launched.appHandleId,
      },
      {},
    );
    await expect.poll(() => existsSync(fixture.payloadPath)).toBe(false);
  });

  it('supersede (a relaunch) removes the predecessor’s payload file', async () => {
    const dialed: FakeApp[] = [];
    const fixture = await launchedWithPayload({
      // The relaunch's terminate-first kills the old process — modelled here
      // as its socket closing, which is what the gateway observes.
      onTerminate: () => dialed[0]?.close(),
    });
    dialed.push(fixture.app);
    await fixture.launchApp(
      { allocationId: fixture.allocation.allocationId, appId: 'com.example.app' },
      {},
    );
    await expect.poll(() => existsSync(fixture.payloadPath)).toBe(false);
  });

  it('release removes the payload file', async () => {
    const fixture = await launchedWithPayload();
    await fixture.release({ allocationId: fixture.allocation.allocationId }, {});
    await expect.poll(() => existsSync(fixture.payloadPath)).toBe(false);
  });

  it('a failed launch (rollback) removes the payload file', async () => {
    const server = await makeServer(); // nothing ever dials in
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    await expect(
      server.launchApp(
        {
          allocationId: allocation.allocationId,
          appId: 'com.example.app',
          userNotification: VALUE,
          deadlineMs: 200,
        },
        {},
      ),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_APP_DIED });
    const payloadPath = server.launches[0].payloadArgs?.detoxUserNotificationDataURL as string;
    // call() awaited the unwind, so this is not a race.
    expect(existsSync(payloadPath)).toBe(false);
  });
});

describe('foreground is a resume relayed to the app’s own word', () => {
  /**
   * @issue DTX-6028
   * `app.foreground()` is a resume, never a launch: `simctl launch` over the
   * live process keeps the pid and performs no new launch transaction —
   * no DYLD re-injection, no argv, no terminate-first, no second handshake.
   * The verb resolves on the app's own `waitForActiveDone`.
   */
  it('runs resume (never terminate), relays waitForActive, settles on the Done frame', async () => {
    const fixture = await withLaunchedApp();
    const address = {
      allocationId: fixture.allocation.allocationId,
      appHandleId: fixture.launched.appHandleId,
    };
    let settled = false;
    const foregrounding = fixture.foregroundApp(address, {});
    void foregrounding.then(
      () => (settled = true),
      () => (settled = true),
    );
    const probe = await fixture.app.waitFor((frame) => frame.type === 'waitForActive');
    expect(settled).toBe(false);
    expect(fixture.resumes).toEqual([{ udid: 'udid-1', bundleId: 'com.example.app', signal: undefined }]);
    expect(fixture.trace).toEqual(['launch:com.example.app', 'resume:com.example.app']);
    fixture.app.send({ type: 'waitForActiveDone', messageId: probe.messageId, params: {} });
    await foregrounding;
  });

  /**
   * @issue DTX-6029
   * `_liveAppSession` checks app-handle liveness after device ownership: a
   * handle this allocation never minted and one whose session died get the
   * same `DETOX_APP_DIED` (the device layer's stale-handle uniformity, one
   * level up) — a dead handle is a tombstone, and no subprocess runs on its behalf.
   */
  it('a dead handle answers DETOX_APP_DIED before any subprocess runs', async () => {
    const fixture = await withLaunchedApp();
    const address = {
      allocationId: fixture.allocation.allocationId,
      appHandleId: fixture.launched.appHandleId,
    };
    await fixture.terminateApp({ ...address, appId: 'com.example.app' }, {});
    await expect(fixture.foregroundApp(address, {})).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_APP_DIED,
    });
    expect(fixture.resumes).toEqual([]);
  });
});

describe('the state waits settle only on the app’s own word', () => {
  it('waitForBackground pends until waitForBackgroundDone echoes its id', async () => {
    const fixture = await withLaunchedApp();
    const address = {
      allocationId: fixture.allocation.allocationId,
      appHandleId: fixture.launched.appHandleId,
    };
    let settled = false;
    const waiting = fixture.waitForBackground(address, {});
    void waiting.then(
      () => (settled = true),
      () => (settled = true),
    );
    const probe = await fixture.app.waitFor((frame) => frame.type === 'waitForBackground');
    expect(settled).toBe(false);
    fixture.app.send({ type: 'waitForBackgroundDone', messageId: probe.messageId, params: {} });
    await waiting;
  });

  it('abort is abandonment: the caller is released, the id is burned, a late Done lands on nothing', async () => {
    const fixture = await withLaunchedApp();
    const address = {
      allocationId: fixture.allocation.allocationId,
      appHandleId: fixture.launched.appHandleId,
    };
    const controller = new AbortController();
    const waiting = fixture.waitForActive(address, { signal: controller.signal });
    const probe = await fixture.app.waitFor((frame) => frame.type === 'waitForActive');
    controller.abort(new Error('walked away'));
    await expect(waiting).rejects.toMatchObject({ name: 'AbortError' });
    // The app's late answer to the abandoned id is dropped harmlessly, and
    // the session still serves a fresh round trip afterwards.
    fixture.app.send({ type: 'waitForActiveDone', messageId: probe.messageId, params: {} });
    const again = fixture.waitForActive(address, {});
    const secondProbe = await fixture.app.waitFor(
      (frame) => frame.type === 'waitForActive' && frame.messageId !== probe.messageId,
    );
    fixture.app.send({ type: 'waitForActiveDone', messageId: secondProbe.messageId, params: {} });
    await again;
  });

  it('a Done frame of the WRONG TYPE does not settle the id it echoes', async () => {
    const fixture = await withLaunchedApp();
    const address = {
      allocationId: fixture.allocation.allocationId,
      appHandleId: fixture.launched.appHandleId,
    };
    let settled = false;
    const waiting = fixture.waitForActive(address, {});
    void waiting.then(
      () => (settled = true),
      () => (settled = true),
    );
    const probe = await fixture.app.waitFor((frame) => frame.type === 'waitForActive');
    // A hostile/buggy process echoing the right id under the wrong spelling
    // must not resolve the wait as if the app had answered it.
    fixture.app.send({ type: 'deliverPayloadDone', messageId: probe.messageId, params: {} });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(settled).toBe(false);
    fixture.app.send({ type: 'waitForActiveDone', messageId: probe.messageId, params: {} });
    await waiting;
  });

  it('an unsolicited Done frame is dropped with a log line, never a crash', async () => {
    const fixture = await withLaunchedApp();
    const address = {
      allocationId: fixture.allocation.allocationId,
      appHandleId: fixture.launched.appHandleId,
    };
    fixture.app.send({ type: 'waitForActiveDone', messageId: 424242, params: {} });
    // The session is alive and well: a real round trip still works after it.
    const waiting = fixture.waitForActive(address, {});
    const probe = await fixture.app.waitFor((frame) => frame.type === 'waitForActive');
    fixture.app.send({ type: 'waitForActiveDone', messageId: probe.messageId, params: {} });
    await waiting;
  });
});

describe('live payload delivery (deliverPayload)', () => {
  const VALUE = { title: 'live', payload: { answer: 42 } };

  /**
   * @issue DTX-6030
   * An immediate delivery's file is spent the moment the app answers Done —
   * the native reads it inside that dispatch — so it is freed right away
   * rather than at handle death: a delivery loop must not accrete one temp
   * dir per call for the handle's life. A delayed payload is parked until
   * the next activation and keeps the handle-lifetime rule instead.
   * @issue DTX-2001
   * Payload values cross as values, never a client-machine path: the server
   * materializes each one to its own file and puts that path on the frozen
   * `deliverPayload` frame. `delayPayload` rides through unchanged as the
   * frame's own flag.
   */
  it('materializes the value, sends the frozen frame, resolves on deliverPayloadDone', async () => {
    const fixture = await withLaunchedApp();
    const address = {
      allocationId: fixture.allocation.allocationId,
      appHandleId: fixture.launched.appHandleId,
    };
    const delivering = fixture.deliverPayload({ ...address, userNotification: VALUE }, {});
    const frame = await fixture.app.waitFor((f) => f.type === 'deliverPayload');
    const framePath = frame.params?.detoxUserNotificationDataURL as string;
    expect(framePath).toMatch(/^\//);
    expect(JSON.parse(await readFile(framePath, 'utf8'))).toEqual(VALUE);
    // No smuggled delay flag on an immediate delivery.
    expect(frame.params).not.toHaveProperty('delayPayload');
    fixture.app.send({ type: 'deliverPayloadDone', messageId: frame.messageId, params: {} });
    await delivering;

    // delayUntilActive → delayPayload: true on the frame (the mapping pin).
    const delayed = fixture.deliverPayload(
      { ...address, userActivity: { k: 2 }, delayPayload: true },
      {},
    );
    const delayedFrame = await fixture.app.waitFor(
      (f) => f.type === 'deliverPayload' && f.params?.delayPayload === true,
    );
    expect(delayedFrame.params?.detoxUserActivityDataURL).toMatch(/^\//);
    fixture.app.send({ type: 'deliverPayloadDone', messageId: delayedFrame.messageId, params: {} });
    await delayed;

    // The url form carries the url (and sourceApp) verbatim — no file.
    const urlDelivery = fixture.deliverPayload(
      { ...address, url: 'scheme://y', sourceApp: 'com.example.src' },
      {},
    );
    const urlFrame = await fixture.app.waitFor((f) => f.type === 'deliverPayload' && f.params?.url === 'scheme://y');
    expect(urlFrame.params?.sourceApp).toBe('com.example.src');
    fixture.app.send({ type: 'deliverPayloadDone', messageId: urlFrame.messageId, params: {} });
    await urlDelivery;

    await expect.poll(() => existsSync(framePath)).toBe(false);
    // The DELAYED payload is parked until the next activation, so its file
    // keeps the handle-lifetime rule and dies with the handle.
    const delayedPath = delayedFrame.params?.detoxUserActivityDataURL as string;
    expect(existsSync(delayedPath)).toBe(true);
    await fixture.terminateApp({ ...address, appId: 'com.example.app' }, {});
    await expect.poll(() => existsSync(delayedPath)).toBe(false);
  });

  /**
   * @issue DTX-2002
   * The earlier draft's client-machine path fields
   * (`detoxUserNotificationDataURL` etc.) are dead and answer version-skew,
   * never a silent read of that field. Exactly one of `url` /
   * `userNotification` / `userActivity` may be present — none or several
   * are both the caller's mistake, typed the same way.
   */
  it('refuses the dead PATH keys (version skew) and an empty selection', async () => {
    const fixture = await withLaunchedApp();
    const address = {
      allocationId: fixture.allocation.allocationId,
      appHandleId: fixture.launched.appHandleId,
    };
    await expect(
      fixture.deliverPayload({ ...address, detoxUserNotificationDataURL: '/tmp/x.json' }, {}),
    ).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { versionSkew: true },
    });
    await expect(fixture.deliverPayload({ ...address }, {})).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
    });
    await expect(
      fixture.deliverPayload({ ...address, url: 'a://b', userNotification: VALUE }, {}),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
  });
});

describe('sync settings ride the frozen setSyncSettings frame (parity)', () => {
  it('relays {enabled} and {blacklistURLs}, resolving on setSyncSettingsDone', async () => {
    const fixture = await withLaunchedApp();
    const address = {
      allocationId: fixture.allocation.allocationId,
      appHandleId: fixture.launched.appHandleId,
    };
    const disabling = fixture.setSyncSettings({ ...address, enabled: false }, {});
    const frame = await fixture.app.waitFor((f) => f.type === 'setSyncSettings');
    // The address never leaks into the native frame (v20 `IosDriver.js:23-25`).
    expect(frame.params).toEqual({ enabled: false });
    fixture.app.send({ type: 'setSyncSettingsDone', messageId: frame.messageId, params: {} });
    await disabling;

    const blacklisting = fixture.setSyncSettings(
      { ...address, blacklistURLs: ['.*127\\.0\\.0\\.1.*'] },
      {},
    );
    const blFrame = await fixture.app.waitFor(
      (f) => f.type === 'setSyncSettings' && f.messageId !== frame.messageId,
    );
    expect(blFrame.params).toEqual({ blacklistURLs: ['.*127\\.0\\.0\\.1.*'] });
    fixture.app.send({ type: 'setSyncSettingsDone', messageId: blFrame.messageId, params: {} });
    await blacklisting;
  });

  it('validates before any side effect: empty and malformed params refuse typed', async () => {
    const fixture = await withLaunchedApp();
    const address = {
      allocationId: fixture.allocation.allocationId,
      appHandleId: fixture.launched.appHandleId,
    };
    await expect(fixture.setSyncSettings({ ...address }, {})).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { method: 'setSyncSettings' },
    });
    await expect(
      fixture.setSyncSettings({ ...address, enabled: 'yes' }, {}),
    ).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { parameter: 'enabled' },
    });
    await expect(
      fixture.setSyncSettings({ ...address, blacklistURLs: ['ok', 7] }, {}),
    ).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { parameter: 'blacklistURLs' },
    });
  });
});

/**
 * @issue DTX-6031
 * `sendToHome` used to predate `_deviceAction` and bypass the erase barrier;
 * spec 006 made the verb publicly reachable, retiring that exception. It
 * now waits out an in-flight erase like every other device action.
 */
describe('sendToHome rides the uniform device-action shape (spec 006 review fix)', () => {
  it('waits out an in-flight erase — the recorded barrier exception is retired', async () => {
    let openGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      openGate = resolve;
    });
    const server = await makeServer({ eraseGate: gate });
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    const wiping = server.resetContentAndSettings({ allocationId: allocation.allocationId }, {});
    await vi.waitFor(() => {
      expect(server.trace).toContain('erase');
    });
    let homeSettled = false;
    const home = server.sendToHome({ allocationId: allocation.allocationId }, {});
    void home.then(
      () => (homeSettled = true),
      () => (homeSettled = true),
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    // The erase is still running; before the fix sendToHome would already
    // have landed a second simctl command on the mid-erase device.
    expect(homeSettled).toBe(false);
    expect(server.trace).not.toContain('sendToHome');
    openGate();
    await wiping;
    await home;
    expect(server.trace.indexOf('sendToHome')).toBeGreaterThan(server.trace.indexOf('erase'));
  });

  it('a stale handle is refused before anything runs', async () => {
    const server = await makeServer();
    await expect(server.sendToHome({ allocationId: 'not-yours' }, {})).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_STALE_HANDLE,
    });
    expect(server.trace).toEqual([]);
  });
});

describe('setPermissions — the device verb', () => {
  it('routes to the dispatch (SimulatorOps) with the allocation’s udid', async () => {
    const server = await makeServer();
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    await server.setPermissions(
      {
        allocationId: allocation.allocationId,
        appId: 'com.example.app',
        permissions: { camera: 'YES' },
      },
      {},
    );
    expect(server.permissionWrites).toEqual([
      {
        udid: 'udid-1',
        bundleId: 'com.example.app',
        permissions: { camera: 'YES' },
        signal: undefined,
      },
    ]);
  });

  it('ownership first: a stale handle hears DETOX_STALE_HANDLE, and nothing runs', async () => {
    const server = await makeServer();
    await expect(
      server.setPermissions(
        { allocationId: 'not-yours', appId: 'com.example.app', permissions: { camera: 'YES' } },
        {},
      ),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_STALE_HANDLE });
    expect(server.permissionWrites).toEqual([]);
  });

  it('requires appId and permissions, typed', async () => {
    const server = await makeServer();
    const allocation = await server.allocate({ type: 'ios.simulator' }, {});
    await expect(
      server.setPermissions({ allocationId: allocation.allocationId, permissions: { camera: 'YES' } }, {}),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    await expect(
      server.setPermissions({ allocationId: allocation.allocationId, appId: 'com.example.app' }, {}),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    // An empty map would be success-that-did-nothing — spec 005's exact ban.
    await expect(
      server.setPermissions(
        { allocationId: allocation.allocationId, appId: 'com.example.app', permissions: {} },
        {},
      ),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    expect(server.permissionWrites).toEqual([]);
  });
});
