/**
 * The living half of `detox/client`: a session (root {@link Detox} handle)
 * over one WebSocket to a Detox Server, and the device handles it hands out.
 */
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';

import WebSocket from 'ws';
import { Peer, createWebSocketChannel, type WebSocketChannel } from '@detox-remote/core';
import { isHttpUrl, PROTOCOL_VERSION, VERSION_SKEW_CLOSE_CODE } from '@detox-remote/protocol';
import type {
  AllocateDeviceResponse,
  DeviceRuntimeState,
  OperationProgress,
} from '@detox-remote/protocol';

import { DetoxClientPeer } from '../DetoxClientPeer';
import type {
  AllocateDeviceOptions,
  Detox,
  DetoxApp,
  DetoxLaunchedApp,
  DeviceApps,
  DetoxCallOptions,
  DetoxDevice,
  DetoxConnectOptions,
  DetoxOperation,
  DetoxOperationName,
  DetoxOperationRef,
  DetoxProgressEvent,
  DetoxServerAddress,
  DetoxLog,
  DetoxLogFields,
  DetoxLogHandle,
  DetoxLogEnd,
  DetoxLogBeginOptions,
  DetoxLogLevel,
  DetoxLogWriter,
  LaunchAppOptions,
  StatusBarOverrides,
  DeviceInfo,
  DeviceInfoOf,
  DeviceState,
  DeviceType,
} from '../client';
import { AbortError, DetoxConnectionError, DetoxError, DetoxErrorCode } from './errors';
import { DetoxAppImpl } from './app';
import { OperationImpl, OperationRegistry } from './operations';
import { BlobLaneClient, archiveAppBundle, ensureBlobUploaded } from './blob-upload';
import { StepContext } from './step-context';

/**
 * The runner-integration door (@internal — never public API): the compat
 * surface smuggles these knobs in on the options object it builds itself.
 * `ambient` is sampled at every operation's creation and composed like a
 * session signal; `unrefSocket` keeps an idle session from holding a jest
 * worker's event loop open; `announceTimeoutMs` overrides
 * {@link ANNOUNCE_TIMEOUT_MS} and exists for the unit suite alone — the timer
 * behind `AbortSignal.timeout` is Node's own, out of reach of fake timers,
 * so the only way to watch the ceiling fire is to lower it. None is declared
 * on {@link DetoxConnectOptions} — `specs/**` never names them, and the public
 * type stays clean.
 */
interface InternalInitOptions {
  ambient?: () => AbortSignal | undefined;
  unrefSocket?: boolean;
  announceTimeoutMs?: number;
}

/**
 * How long `connect` waits for `$/serverInfo` after the socket has opened.
 *
 * The server sends the announce from its own connection handler, in the same
 * tick that writes the handshake response — so by the time `open` fires here
 * the frame is on the wire already, often in the same TCP segment. Nothing
 * legitimate stretches that to seconds: a relay announces itself the same
 * way rather than waiting on its upstream, and a slow server start is spent
 * before the handshake, not after it. What the bound is for is the endpoint
 * that accepted the socket and will never announce — a WebSocket service that
 * is not Detox, a server predating the announce, or the frame lost
 * somewhere — which otherwise parks `connect` for the life of the process.
 * Thirty seconds is four orders of magnitude over the honest case and past
 * any TCP retransmit or event-loop stall a live handshake could survive, so
 * it can only ever trip on a wait that was never going to end.
 */
const ANNOUNCE_TIMEOUT_MS = 30_000;

/** The underlying net.Socket handle `ws` keeps private — reached only to unref it. */
interface UnrefableNetSocket {
  unref?: () => void;
}

interface WsWithNetSocket {
  _socket?: UnrefableNetSocket;
}

export async function connectSession(options: DetoxConnectOptions): Promise<Detox> {
  const address: DetoxServerAddress =
    typeof options.server === 'string' ? { url: options.server } : options.server;
  const internal = options as DetoxConnectOptions & InternalInitOptions;
  const registry = new OperationRegistry(options.signal, internal.ambient);

  // Connecting is itself an operation — no handle exists yet to subscribe to,
  // so it narrates through `options.onProgress` only. The channel comes back
  // with the socket, already listening: see `connectWebSocket`.
  const { socket, channel } = await registry.run<DialedSocket>('connect', {
    onProgress: options.onProgress,
    execute: (operation) => connectWebSocket(address, operation.signal),
  });

  if (internal.unrefSocket === true) {
    // An idle session must never be the reason a jest worker (or an in-band
    // main process) cannot exit; the peer's retention sweeper is unref'd
    // already, so the TCP socket is the last live handle.
    (socket as unknown as WsWithNetSocket)._socket?.unref?.();
  }

  const session = new DetoxSession({
    socket,
    channel,
    registry,
    address,
    signal: options.signal,
    ambient: internal.ambient,
  });
  // The announce is the server's first frame; since spec 012 it
  // also carries the connection's log id, so the handle is not ready until
  // it has arrived: `detox.runId` must be readable the moment `connect`
  // resolves. A socket that closes first rejects typed; a socket that stays
  // open and silent runs into the ceiling below. The caller's own signal is
  // composed in ahead of the clock, so when both could apply the caller's
  // abort keeps its `AbortError` and only the clock's own expiry is
  // reclassified — `AbortSignal.any` carries the winning source's reason
  // through by identity, which is what tells the two apart.
  const timeoutMs = internal.announceTimeoutMs ?? ANNOUNCE_TIMEOUT_MS;
  const deadline = AbortSignal.timeout(timeoutMs);
  const signal = options.signal ? AbortSignal.any([options.signal, deadline]) : deadline;
  try {
    await session.announced(signal);
  } catch (err) {
    if (!deadline.aborted || signal.reason !== deadline.reason) throw err;
    // Same exit the caller's abort takes (see the constructor): the socket
    // must not outlive the `connect` that gave up on it.
    void session.disconnect();
    throw new DetoxConnectionError(
      `Detox Server at ${address.url} accepted the connection but did not announce itself within ${timeoutMs}ms — ` +
        'either that address is not a Detox 21 server, or its first frame was lost: check the address, then connect again',
      {
        code: DetoxErrorCode.DETOX_SERVER_DID_NOT_ANNOUNCE,
        details: { url: address.url, timeoutMs },
      },
    );
  }
  return session;
}

/** The `detox.log` namespace: a callable `info` writer carrying the four level writers and `begin`. */
function buildLog(session: DetoxSession): DetoxLog {
  const writer =
    (level: DetoxLogLevel): DetoxLogWriter =>
    (first: string | DetoxLogFields, second?: string): void => {
      session.writeLine(level, first, second);
    };
  const log = writer('info') as DetoxLog & { error: DetoxLogWriter; warn: DetoxLogWriter; info: DetoxLogWriter; debug: DetoxLogWriter; begin: DetoxLog['begin'] };
  log.error = writer('error');
  log.warn = writer('warn');
  log.info = writer('info');
  log.debug = writer('debug');
  log.begin = (options: DetoxLogBeginOptions): DetoxLogHandle => session.beginStep(options);
  return log;
}

/** The slice of the refused handshake's HTTP response we actually read. */
interface HandshakeResponse {
  statusCode?: number;
}

/**
 * A dialed socket and the channel that has been listening on it since before
 * it opened — the two are handed over together on purpose (see below).
 */
interface DialedSocket {
  socket: WebSocket;
  channel: WebSocketChannel;
}

function connectWebSocket(address: DetoxServerAddress, signal: AbortSignal): Promise<DialedSocket> {
  if (signal.aborted) {
    return Promise.reject(new AbortError(signal.reason));
  }
  const socket = new WebSocket(address.url, { headers: address.headers });
  // Built here, before `open` can fire, and never in the continuation of the
  // dial promise: the server answers `$/serverInfo` from its own connection
  // handler, so that frame can ride the very TCP segment that carries the
  // handshake response. `ws` then unshifts those bytes and delivers them on
  // the nextTick queue — which runs BEFORE the promise microtask that would
  // have built the channel — so a channel built after the await misses the
  // announce entirely, with no listener attached and nothing to buffer into.
  // A missed frame is not a retry: the announce comes once, so losing it
  // turns a good connection into one that can only fail on
  // `ANNOUNCE_TIMEOUT_MS` (and did park `connect` for the life of the
  // process before that ceiling existed). Attaching first makes the
  // channel's own pending buffer cover the only window that remains:
  // channel built → the session's `onServerInfo` handler registered. The
  // channel drains that buffer one microtask after `Peer.create` attaches
  // to it, which is what lets a handler registered in the same turn as the
  // peer (see the `DetoxSession` constructor) see the announce at all.
  const channel = createWebSocketChannel(socket);
  return new Promise<DialedSocket>((resolve, reject) => {
    const onOpen = () => {
      cleanup();
      resolve({ socket, channel });
    };
    const onError = (error: Error) => {
      cleanup();
      reject(
        new DetoxConnectionError(`Could not connect to Detox Server at ${address.url}`, {
          code: DetoxErrorCode.DETOX_SERVER_UNREACHABLE,
          details: { url: address.url },
          cause: error,
        }),
      );
    };
    // The server refused the handshake rather than failing to answer it. Worth
    // its own message: "connection refused" and "your token is wrong" send a
    // reader to entirely different places.
    const onUnexpectedResponse = (_req: unknown, res: HandshakeResponse) => {
      cleanup();
      socket.terminate();
      const status = res.statusCode ?? 0;
      reject(
        status === 401
          ? new DetoxConnectionError(rejectionMessage(address, status), {
              code: DetoxErrorCode.DETOX_UNAUTHORIZED,
              details: { status },
            })
          : new DetoxConnectionError(rejectionMessage(address, status), {
              code: DetoxErrorCode.DETOX_SERVER_UNREACHABLE,
              details: { url: address.url, status },
            }),
      );
    };
    const onAbort = () => {
      cleanup();
      socket.terminate();
      reject(new AbortError(signal.reason));
    };
    const cleanup = () => {
      socket.off('open', onOpen);
      socket.off('error', onError);
      socket.off('unexpected-response', onUnexpectedResponse);
      signal.removeEventListener('abort', onAbort);
      // `terminate()` below (unexpected-response / abort) can surface an async
      // "WebSocket was closed before the connection was established" 'error'
      // that nothing here listens for any more — without a sink it escapes as
      // an uncaught exception instead of the rejection above (observed in
      // accept-004 test 4). The promise is already settling; anything the
      // socket says after this is not this call's news.
      socket.on('error', () => {});
    };
    socket.once('open', onOpen);
    socket.once('error', onError);
    socket.once('unexpected-response', onUnexpectedResponse);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function rejectionMessage(address: DetoxServerAddress, status: number): string {
  const prefix = `Detox Server at ${address.url} rejected the connection`;
  if (status !== 401) return `${prefix}: HTTP ${status}`;
  // Header names are case-insensitive, so this cannot key off `.Authorization`
  // alone — getting it wrong sends the reader chasing a token they never sent.
  const sentToken = Object.entries(address.headers ?? {}).some(
    ([name, value]) => name.toLowerCase() === 'authorization' && value.trim().length > 'Bearer'.length,
  );
  return sentToken
    ? `${prefix}: 401 Unauthorized — the Authorization token was rejected`
    : `${prefix}: 401 Unauthorized — no Authorization token was sent; ` +
        'this server was configured with a token (auth is opt-in) — ' +
        'set client.token in the detox config or DETOX_CLIENT_TOKEN';
}

interface DetoxSessionInit {
  socket: WebSocket;
  /**
   * The channel already listening on `socket` (`connectWebSocket` builds it
   * before the socket opens, so no frame is missed). Optional so a caller
   * holding only a socket still works; that path can miss an announce that
   * shares a segment with the handshake.
   */
  channel?: WebSocketChannel;
  registry: OperationRegistry;
  /** Where the server lives — the blob lane dials the same address over HTTP. */
  address: DetoxServerAddress;
  signal?: AbortSignal;
  /** The runner-integration ambient provider (@internal) — see {@link connectSession}. */
  ambient?: () => AbortSignal | undefined;
}

class DetoxSession implements Detox {
  readonly #channel: WebSocketChannel;
  readonly #client: DetoxClientPeer;
  readonly #registry: OperationRegistry;
  readonly #blobLane: BlobLaneClient;
  readonly #sessionSignal: AbortSignal | undefined;
  readonly #ambient: (() => AbortSignal | undefined) | undefined;
  /** Which step the caller is inside (spec 013): read by every request frame and every `$/log` begin. */
  readonly #steps = new StepContext();
  readonly #devices = new Map<string, DetoxDeviceImpl>();
  /**
   * @issue DTX-3007: pushes that arrive before their device handle exists
   * are queued here and applied once it's registered.
   */
  readonly #earlyStates = new Map<string, DeviceRuntimeState>();
  #closing: Promise<void> | undefined;
  /** The log id the announce carried — `undefined` on an endpoint that records none (spec 012). */
  #runId: string | undefined;
  #announced = false;
  #resolveAnnounced!: () => void;
  #rejectAnnounced!: (err: Error) => void;
  readonly #announce = new Promise<void>((resolve, reject) => {
    this.#resolveAnnounced = resolve;
    this.#rejectAnnounced = reject;
  });

  constructor({ socket, channel, registry, address, signal, ambient }: DetoxSessionInit) {
    this.#channel = channel ?? createWebSocketChannel(socket);
    this.#client = new DetoxClientPeer({ peer: Peer.create(this.#channel), stepOf: () => this.#steps.current() });
    this.#registry = registry;
    this.#blobLane = new BlobLaneClient(address);
    this.#sessionSignal = signal;
    this.#ambient = ambient;

    // The version announce: a server speaking a different wire protocol is
    // refused here, typed, before its frames can mean the wrong thing. The
    // close code settles every pending and future call as
    // DETOX_VERSION_SKEW instead of a bare "connection lost".
    //
    // Since spec 012 the announce is also a barrier: `connect` awaits it (via
    // `announced()`) so `runId`/`log` are ready the moment the handle
    // resolves. Every v21 server sends `$/serverInfo` as its first frame, so
    // this settles in milliseconds; a socket that dies first rejects
    // `connect` typed (see `#channel.onClose` below). This class keeps no
    // clock of its own: an endpoint that accepts the socket and never
    // announces (a non-Detox WS service, a server old enough to predate the
    // announce, a lost frame) is `connectSession`'s to give up on, against
    // `ANNOUNCE_TIMEOUT_MS` composed with the caller's `signal`.
    this.#client.onServerInfo(({ protocol, server, log }) => {
      if (!this.#announced) {
        this.#announced = true;
        this.#runId = typeof log?.runId === 'string' ? log.runId : undefined;
        this.#resolveAnnounced();
      }
      if (protocol === PROTOCOL_VERSION) return;
      socket.close(
        VERSION_SKEW_CLOSE_CODE,
        `version skew: server ${String(server).slice(0, 24)} speaks protocol ${String(protocol)}, ` +
          `this client speaks ${String(PROTOCOL_VERSION)} — upgrade or restart your detox server`,
      );
    });

    // The server watches allocated devices and pushes state changes — this is
    // how `device.state` notices a shutdown that happened behind our back.
    this.#client.onDeviceStateChanged(({ allocationId, state }) => {
      const device = this.#devices.get(allocationId);
      if (device) device.applyState(state);
      else this.#earlyStates.set(allocationId, state);
    });

    // A socket that dies before the announce: `connect` rejects typed instead
    // of parking forever on a frame that will never come.
    this.#channel.onClose((info) => {
      if (this.#announced) return;
      this.#announced = true;
      this.#rejectAnnounced(
        new DetoxConnectionError(
          `Detox Server at ${address.url} closed the connection before announcing itself${info?.reason ? `: ${info.reason}` : ''}`,
          { code: DetoxErrorCode.DETOX_CONNECTION_LOST, details: info?.code !== undefined ? { closeCode: info.code } : undefined },
        ),
      );
    });
    // Swallowed here so an unobserved rejection never escapes: `announced()` re-attaches.
    this.#announce.catch(() => undefined);

    // In-flight operations reject through their own composed signals; closing
    // the connection afterwards is just hygiene, so the session cannot keep
    // the caller's process alive.
    signal?.addEventListener(
      'abort',
      () => {
        void this.disconnect();
      },
      { once: true },
    );
  }

  allocateDevice<T extends DeviceType>(
    options: AllocateDeviceOptions<T>,
  ): DetoxOperation<DetoxDevice<DeviceInfoOf<T>>, 'allocateDevice'> {
    const operation = this.#registry.run<DetoxDevice<DeviceInfoOf<T>>>('allocateDevice', {
      signal: options.signal,
      onProgress: options.onProgress,
      execute: async (op) => {
        const response = await this.#client.allocateDevice(
          // The query is the driver's own vocabulary, carried verbatim (spec 015).
          { type: options.type, device: options.device },
          {
            signal: op.signal,
            onProgress: (value) => this.#routeWireProgress(op, value),
          },
        );
        const device = new DetoxDeviceImpl({
          deps: this.#deviceDeps(),
          type: options.type,
          response,
        });
        this.#devices.set(response.allocationId, device);
        const early = this.#earlyStates.get(response.allocationId);
        if (early !== undefined) {
          this.#earlyStates.delete(response.allocationId);
          device.applyState(early);
        }
        return device as unknown as DetoxDevice<DeviceInfoOf<T>>;
      },
    });
    return operation as unknown as DetoxOperation<DetoxDevice<DeviceInfoOf<T>>, 'allocateDevice'>;
  }

  /** Resolves once `$/serverInfo` has arrived; rejects if the socket dies or `signal` aborts first. */
  announced(signal?: AbortSignal): Promise<void> {
    const announce = this.#announce;
    if (!signal) return announce;
    if (signal.aborted) return Promise.reject(new AbortError(signal.reason));
    return new Promise<void>((resolve, reject) => {
      const onAbort = (): void => reject(new AbortError(signal.reason));
      signal.addEventListener('abort', onAbort, { once: true });
      announce.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
    });
  }

  get runId(): string | undefined {
    return this.#runId;
  }

  readonly log: DetoxLog = buildLog(this);

  step(name: string): DetoxLogHandle;
  step<T>(name: string, fn: () => T | Promise<T>): Promise<T>;
  step<T>(name: string, fn?: () => T | Promise<T>): DetoxLogHandle | Promise<T> {
    const handle = this.beginStep({ kind: 'step', name });
    if (fn === undefined) return handle;
    // The body runs inside the step (spec 013): its calls and nested steps
    // are this step's children, under `test.concurrent` too.
    return handle.run(async (): Promise<T> => {
      try {
        const result = await fn();
        handle.end({ status: 'passed' });
        return result;
      } catch (err) {
        const error = err instanceof Error ? { name: err.name, message: err.message } : { name: 'Error', message: String(err) };
        handle.end({ status: err instanceof AbortError ? 'aborted' : 'failed', error });
        throw err;
      }
    });
  }

  /** @internal The door `log.begin`/`step` share; refuses typed on an endpoint that announced no log. */
  beginStep(options: DetoxLogBeginOptions): DetoxLogHandle {
    this.#requireLog('log.begin');
    const id = randomUUID();
    // Explicit beats ambient (spec 013): a runner names the parent of a
    // describe or hook step itself; a step begun inside another's `run`
    // nests there; a root step carries no parent and the server's own rule
    // applies.
    const parent = options.parent ?? this.#steps.current();
    // `kind` and `attrs` travel unvalidated: the server is the judge.
    this.#client.notifyLog({
      id,
      phase: 'begin',
      kind: options.kind,
      name: options.name,
      ...(options.attrs !== undefined ? { attrs: options.attrs } : {}),
      ...(parent !== undefined ? { parent } : {}),
    });
    let ended = false;
    const steps = this.#steps;
    return {
      id,
      end: (outcome: DetoxLogEnd): void => {
        // The second end is the server's to refuse (one warn line); the
        // client sends what it was told so the log says what the wire said.
        ended = true;
        this.#client.notifyLog({
          id,
          phase: 'end',
          status: outcome.status,
          ...(outcome.error !== undefined ? { error: { name: outcome.error.name, message: outcome.error.message } } : {}),
        });
      },
      get ended() {
        return ended;
      },
      run: <T>(fn: () => T): T => steps.run(id, fn),
    };
  }

  /** @internal One line; `level`, `msg` and `fields` travel unvalidated, the server judges. */
  writeLine(level: DetoxLogLevel, first: string | DetoxLogFields, second?: string): void {
    this.#requireLog(`log.${level}`);
    const [fields, msg] = typeof first === 'string' ? [undefined, first] : [first, second ?? ''];
    const step = this.#steps.current();
    this.#client.notifyLog({ phase: 'log', level, msg, ...(fields !== undefined ? { fields } : {}), ...(step !== undefined ? { step } : {}) });
  }

  #requireLog(method: string): void {
    // A typed refusal, never a silent drop: an endpoint that records no
    // log — an older server, or a relay that predates its own log —
    // announces no `log`, so anything sent there would vanish (spec 012).
    if (this.#runId === undefined) {
      throw new DetoxError('this endpoint does not record a log', {
        code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED,
        details: { method },
      });
    }
  }

  on(event: 'operation', listener: (operation: DetoxOperationRef) => void): this {
    if (event === 'operation') this.#registry.onOperation(listener);
    return this;
  }

  off(event: 'operation', listener: (operation: DetoxOperationRef) => void): this {
    if (event === 'operation') this.#registry.offOperation(listener);
    return this;
  }

  disconnect(): Promise<void> {
    // @issue DTX-3010: memoized, so a second concurrent call awaits the same close.
    this.#closing ??= this.#close();
    return this.#closing;
  }

  #close(): Promise<void> {
    // @issue DTX-3011: no per-device releases — the connection close reclaims
    // everything server-side.
    //
    // Known residue: this close is synchronous, so a call aborted by the same
    // signal may find the channel already closed before its own
    // `$/cancelRequest` goes out, and settles as `outcome: 'unknown'` at 0 ms.
    try {
      this.#channel.close();
      return Promise.resolve();
    } catch (err) {
      // No channel throws synchronously today; if one ever does, keep the
      // old async contract — a rejected promise, never a sync throw out of
      // disconnect() (the abort listener void-calls it).
      return Promise.reject(err instanceof Error ? err : new Error(String(err)));
    } finally {
      // @issue DTX-3012: releases every device server-side; handles must
      // learn that or disposal will ask a closed peer for a release.
      for (const device of [...this.#devices.values()]) device.forgetOwnership();
    }
  }

  [Symbol.asyncDispose](): Promise<void> {
    return this.disconnect();
  }

  #deviceDeps(): DeviceDeps {
    return {
      client: this.#client,
      registry: this.#registry,
      blobLane: this.#blobLane,
      sessionSignal: this.#sessionSignal,
      ambient: this.#ambient,
      routeWireProgress: (op, value) => this.#routeWireProgress(op, value),
      onReleased: (allocationId) => {
        this.#devices.delete(allocationId);
        this.#earlyStates.delete(allocationId);
      },
    };
  }

  /**
   * Turns `$/progress` values into progress events on the right operation.
   * `begin`/`end` bracket server-born sub-operations, which surface as child
   * operations of the wire call that spawned them.
   */
  #routeWireProgress(root: OperationImpl<unknown>, value: unknown): void {
    if (!isOperationProgress(value)) return;
    const name = value.op as DetoxOperationName;

    if (name === root.name) {
      root.dispatchProgress(progressEvent(root, value.message));
      return;
    }
    if (value.kind === 'begin') {
      const child = this.#registry.beginChild(name, root);
      child.dispatchProgress(progressEvent(child, value.message));
      return;
    }
    const child = root.child(name);
    if (!child) return;
    if (value.kind === 'end') {
      child.settle(
        value.ok === false
          ? { ok: false, error: new Error(`Operation "${name}" failed on the server`) }
          : { ok: true },
      );
    } else {
      child.dispatchProgress(progressEvent(child, value.message));
    }
  }
}

interface DeviceDeps {
  client: DetoxClientPeer;
  registry: OperationRegistry;
  /** The upload half of `installApp` (spec 007) — same server, plain HTTP. */
  blobLane: BlobLaneClient;
  /** The session-wide signal, handed to app handles whose calls are plain promises (no registry composition). */
  sessionSignal?: AbortSignal;
  /** The runner-integration ambient provider (@internal), same journey as `sessionSignal`. */
  ambient?: () => AbortSignal | undefined;
  routeWireProgress: (root: OperationImpl<unknown>, value: unknown) => void;
  onReleased: (allocationId: string) => void;
}

interface DeviceInit {
  deps: DeviceDeps;
  type: DeviceType;
  response: AllocateDeviceResponse;
}

/** The wire shape an attach/activate/connected handle result carries. */
interface AppHandleShape {
  appHandleId: string;
  pid?: number;
}

/** What a device operation hands to the typed peer methods. */
interface WireCallOptions {
  signal: AbortSignal;
  onProgress: (value: unknown) => void;
}

class DetoxDeviceImpl implements DetoxDevice {
  readonly info: DeviceInfo;
  #state: DeviceState;
  #released = false;
  readonly #deps: DeviceDeps;
  readonly #serverUrl: string;
  #appsView: DeviceApps | undefined;

  constructor({ deps, type, response }: DeviceInit) {
    this.#deps = deps;
    this.info = toDeviceInfo(type, response);
    this.#state = response.state;
    this.#serverUrl = response.apps.serverUrl;
  }

  get state(): DeviceState {
    return this.#state;
  }

  /** The device's app collection (spec 015): `launch`/`activate`/`attach`/`connected`/`serverUrl`. */
  get apps(): DeviceApps {
    this.#appsView ??= {
      serverUrl: this.#serverUrl,
      // `launch` is the same registry operation `device.launchApp` is (the
      // frozen alias); `activate`/`attach`/`connected` are signal-only wire
      // calls, like the app handle's own element traffic.
      launch: (bundleId, options) => this.launchApp(bundleId, options),
      activate: async (bundleId, options = {}) => {
        const result = await this.#deps.client.activateApp(
          { allocationId: this.info.allocationId, appId: bundleId },
          { signal: this.#appSignal(options.signal) },
        );
        return this.#buildApp(result.bundleId, result);
      },
      attach: async (sessionId, options = {}) => {
        const result = await this.#deps.client.attachApp(
          { allocationId: this.info.allocationId, sessionId },
          { signal: this.#appSignal(options.signal) },
        );
        return this.#buildApp(result.bundleId, result);
      },
      connected: async (options = {}) => {
        const { apps } = await this.#deps.client.connectedApps(
          { allocationId: this.info.allocationId },
          { signal: this.#appSignal(options.signal) },
        );
        return apps.map((entry) => this.#buildApp(entry.bundleId, entry));
      },
    };
    return this.#appsView;
  }

  /** Session signal composed with the call's own — AbortSignal-first, like the app handle. */
  #appSignal(callSignal: AbortSignal | undefined): AbortSignal | undefined {
    const signals = [this.#deps.sessionSignal, this.#deps.ambient?.(), callSignal].filter(
      (signal): signal is AbortSignal => signal !== undefined,
    );
    if (signals.length === 0) return undefined;
    return signals.length === 1 ? signals[0] : AbortSignal.any(signals);
  }

  /** Builds a handle from an attach/activate/connected result — pid absent on an attach. */
  #buildApp(bundleId: string, result: AppHandleShape): DetoxApp {
    return new DetoxAppImpl({
      client: this.#deps.client,
      registry: this.#deps.registry,
      routeWireProgress: this.#deps.routeWireProgress,
      allocationId: this.info.allocationId,
      appHandleId: result.appHandleId,
      bundleId,
      pid: result.pid,
      sessionSignal: this.#deps.sessionSignal,
      ambient: this.#deps.ambient,
    });
  }

  /** Fed by the server's push channel — never a cache of our own calls. */
  applyState(state: DeviceRuntimeState): void {
    this.#state = state;
  }

  /**
   * The session closed under this handle: the connection-level reclaim has
   * already released the device server-side, so disposal has nothing left to
   * ask for. Mirrors `#noteDeviceLost`, with the session close as the
   * evidence instead of a typed rejection.
   */
  forgetOwnership(): void {
    if (this.#released) return;
    this.#released = true;
    this.#deps.onReleased(this.info.allocationId);
  }

  // @issue DTX-3009: neither boot nor shutdown writes `#state` from its own
  // response — the push channel is the sole writer after allocation.
  boot(options: DetoxCallOptions = {}): DetoxOperation<void, 'boot'> {
    return this.#call('boot', options, async (op) => {
      await this.#deps.client.bootDevice(
        { allocationId: this.info.allocationId },
        this.#wireOptions(op),
      );
    }) as DetoxOperation<void, 'boot'>;
  }

  shutdown(options: DetoxCallOptions = {}): DetoxOperation<void, 'shutdown'> {
    return this.#call('shutdown', options, async (op) => {
      await this.#deps.client.shutdownDevice(
        { allocationId: this.info.allocationId },
        this.#wireOptions(op),
      );
    }) as DetoxOperation<void, 'shutdown'>;
  }

  release(options: DetoxCallOptions = {}): DetoxOperation<void, 'release'> {
    return this.#call('release', options, async (op) => {
      await this.#deps.client.releaseDevice(
        { allocationId: this.info.allocationId },
        this.#wireOptions(op),
      );
      this.#released = true;
      this.#deps.onReleased(this.info.allocationId);
    }) as DetoxOperation<void, 'release'>;
  }

  // ── The device-utilities toolbelt ────────────────────────────────────────
  // Every one is the same three lines as boot/shutdown above: an operation of
  // its own name (so it narrates and appears on `detox.on('operation')`), the
  // session signal inherited through the registry, and the allocationId as
  // the only address — the registry is the address book, so a released
  // handle's utility call is refused server-side rather than landing on the
  // device's next owner.

  uninstallApp(appId: string, options: DetoxCallOptions = {}): DetoxOperation<void, 'uninstallApp'> {
    return this.#call('uninstallApp', options, async (op) => {
      await this.#deps.client.uninstallApp(
        { allocationId: this.info.allocationId, appId },
        this.#wireOptions(op),
      );
    }) as DetoxOperation<void, 'uninstallApp'>;
  }

  openURL(url: string, options: DetoxCallOptions = {}): DetoxOperation<void, 'openURL'> {
    return this.#call('openURL', options, async (op) => {
      await this.#deps.client.openURL(
        { allocationId: this.info.allocationId, url },
        this.#wireOptions(op),
      );
    }) as DetoxOperation<void, 'openURL'>;
  }

  setLocation(
    lat: number,
    lon: number,
    options: DetoxCallOptions = {},
  ): DetoxOperation<void, 'setLocation'> {
    return this.#call('setLocation', options, async (op) => {
      await this.#deps.client.setLocation(
        { allocationId: this.info.allocationId, lat, lon },
        this.#wireOptions(op),
      );
    }) as DetoxOperation<void, 'setLocation'>;
  }

  setStatusBar(
    overrides: StatusBarOverrides,
    options: DetoxCallOptions = {},
  ): DetoxOperation<void, 'setStatusBar'> {
    return this.#call('setStatusBar', options, async (op) => {
      await this.#deps.client.setStatusBar(
        { ...overrides, allocationId: this.info.allocationId },
        this.#wireOptions(op),
      );
    }) as DetoxOperation<void, 'setStatusBar'>;
  }

  resetStatusBar(options: DetoxCallOptions = {}): DetoxOperation<void, 'resetStatusBar'> {
    return this.#call('resetStatusBar', options, async (op) => {
      await this.#deps.client.resetStatusBar(
        { allocationId: this.info.allocationId },
        this.#wireOptions(op),
      );
    }) as DetoxOperation<void, 'resetStatusBar'>;
  }

  setBiometricEnrollment(
    enabled: boolean,
    options: DetoxCallOptions = {},
  ): DetoxOperation<void, 'setBiometricEnrollment'> {
    return this.#call('setBiometricEnrollment', options, async (op) => {
      await this.#deps.client.setBiometricEnrollment(
        { allocationId: this.info.allocationId, enabled },
        this.#wireOptions(op),
      );
    }) as DetoxOperation<void, 'setBiometricEnrollment'>;
  }

  matchFace(options: DetoxCallOptions = {}): DetoxOperation<void, 'matchFace'> {
    return this.#call('matchFace', options, async (op) => {
      await this.#deps.client.matchFace({ allocationId: this.info.allocationId }, this.#wireOptions(op));
    }) as DetoxOperation<void, 'matchFace'>;
  }

  unmatchFace(options: DetoxCallOptions = {}): DetoxOperation<void, 'unmatchFace'> {
    return this.#call('unmatchFace', options, async (op) => {
      await this.#deps.client.unmatchFace({ allocationId: this.info.allocationId }, this.#wireOptions(op));
    }) as DetoxOperation<void, 'unmatchFace'>;
  }

  matchFinger(options: DetoxCallOptions = {}): DetoxOperation<void, 'matchFinger'> {
    return this.#call('matchFinger', options, async (op) => {
      await this.#deps.client.matchFinger({ allocationId: this.info.allocationId }, this.#wireOptions(op));
    }) as DetoxOperation<void, 'matchFinger'>;
  }

  unmatchFinger(options: DetoxCallOptions = {}): DetoxOperation<void, 'unmatchFinger'> {
    return this.#call('unmatchFinger', options, async (op) => {
      await this.#deps.client.unmatchFinger({ allocationId: this.info.allocationId }, this.#wireOptions(op));
    }) as DetoxOperation<void, 'unmatchFinger'>;
  }

  clearKeychain(options: DetoxCallOptions = {}): DetoxOperation<void, 'clearKeychain'> {
    return this.#call('clearKeychain', options, async (op) => {
      await this.#deps.client.clearKeychain(
        { allocationId: this.info.allocationId },
        this.#wireOptions(op),
      );
    }) as DetoxOperation<void, 'clearKeychain'>;
  }

  resetContentAndSettings(
    options: DetoxCallOptions = {},
  ): DetoxOperation<void, 'resetContentAndSettings'> {
    return this.#call('resetContentAndSettings', options, async (op) => {
      await this.#deps.client.resetContentAndSettings(
        { allocationId: this.info.allocationId },
        this.#wireOptions(op),
      );
    }) as DetoxOperation<void, 'resetContentAndSettings'>;
  }

  // ── The app gateway ──────────────────────────────────────────────────────

  installApp(appPath: string, options: DetoxCallOptions = {}): DetoxOperation<void, 'installApp'> {
    return this.#call('installApp', options, async (op) => {
      // @issue DTX-3014: a URL travels verbatim — the server fetches the archive itself.
      if (isHttpUrl(appPath)) {
        await this.#deps.client.installApp(
          { allocationId: this.info.allocationId, appPath },
          this.#wireOptions(op),
        );
        return;
      }

      // @issue DTX-3015: archive, hash, upload once if the server lacks it,
      // install by hash — works no matter where the server is.
      const narrate = (message: string): void => {
        op.dispatchProgress(progressEvent(op, message));
      };
      narrate(`Archiving ${appPath}`);
      const prepared = await archiveAppBundle(path.resolve(appPath), { signal: op.signal });
      try {
        await ensureBlobUploaded(this.#deps.blobLane, prepared, {
          signal: op.signal,
          narrate,
        });
        const params = {
          allocationId: this.info.allocationId,
          blob: { algo: 'sha256', hex: prepared.hex },
        };
        try {
          await this.#deps.client.installApp(params, this.#wireOptions(op));
        } catch (err) {
          // @issue DTX-3013: at most one transparent re-upload round
          // (HEAD→PUT→retry); a second failure surfaces as-is.
          if (codeOf(err) !== DetoxErrorCode.DETOX_APP_TRANSFER_FAILED) throw err;
          narrate('The server lost the build mid-install (eviction race) — re-uploading once');
          await ensureBlobUploaded(this.#deps.blobLane, prepared, {
            signal: op.signal,
            narrate,
          });
          await this.#deps.client.installApp(params, this.#wireOptions(op));
        }
      } finally {
        await prepared.dispose();
      }
    }) as DetoxOperation<void, 'installApp'>;
  }

  launchApp(bundleId: string, options: LaunchAppOptions = {}): DetoxOperation<DetoxLaunchedApp, 'launchApp'> {
    return this.#call('launchApp', options, async (op) => {
      // @issue DTX-3016: options travel verbatim, and only when present — validation is server-side.
      const { pid, appHandleId } = await this.#deps.client.launchApp(
        { allocationId: this.info.allocationId, appId: bundleId, ...launchWireFields(options) },
        this.#wireOptions(op),
      );
      // A launch always returned a pid, so this handle is a `DetoxLaunchedApp`.
      return this.#buildApp(bundleId, { appHandleId, pid }) as DetoxLaunchedApp;
    }) as DetoxOperation<DetoxLaunchedApp, 'launchApp'>;
  }

  // ── Launch options and app-state sync ───────────────────────────────────

  setPermissions(
    appId: string,
    permissions: Record<string, string>,
    options: DetoxCallOptions = {},
  ): DetoxOperation<void, 'setPermissions'> {
    return this.#call('setPermissions', options, async (op) => {
      await this.#deps.client.setPermissions(
        { allocationId: this.info.allocationId, appId, permissions },
        this.#wireOptions(op),
      );
    }) as DetoxOperation<void, 'setPermissions'>;
  }

  sendToHome(options: DetoxCallOptions = {}): DetoxOperation<void, 'sendToHome'> {
    return this.#call('sendToHome', options, async (op) => {
      await this.#deps.client.sendToHome(
        { allocationId: this.info.allocationId },
        this.#wireOptions(op),
      );
    }) as DetoxOperation<void, 'sendToHome'>;
  }

  /** @issue DTX-3019: disposal swallows DETOX_STALE_HANDLE only; any other release failure propagates. */
  async [Symbol.asyncDispose](): Promise<void> {
    if (this.#released) return;
    try {
      await this.release();
    } catch (err) {
      if (codeOf(err) !== DetoxErrorCode.DETOX_STALE_HANDLE) throw err;
    }
  }

  #call<T = void>(
    name: DetoxOperationName,
    options: DetoxCallOptions,
    execute: (op: OperationImpl<T>) => Promise<T>,
  ): OperationImpl<T> {
    return this.#deps.registry.run<T>(name, {
      signal: options.signal,
      onProgress: options.onProgress,
      execute: async (op) => {
        try {
          return await execute(op);
        } catch (err) {
          this.#noteDeviceLost(err);
          throw err;
        }
      },
    });
  }

  /** @issue DTX-3018: a DETOX_DEVICE_UNKNOWN_STATE rejection marks the handle released — the server already dropped it. */
  #noteDeviceLost(err: unknown): void {
    if (this.#released || codeOf(err) !== DetoxErrorCode.DETOX_DEVICE_UNKNOWN_STATE) return;
    this.#released = true;
    this.#deps.onReleased(this.info.allocationId);
  }

  #wireOptions(op: OperationImpl<unknown>): WireCallOptions {
    return {
      signal: op.signal,
      onProgress: (value) => this.#deps.routeWireProgress(op, value),
    };
  }
}

/** The Detox code an error carries, if any — duck-typed across package copies. */
function codeOf(err: unknown): number | undefined {
  return (err as { code?: number } | null | undefined)?.code;
}

function isOperationProgress(value: unknown): value is OperationProgress {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Partial<OperationProgress>).op === 'string' &&
    typeof (value as Partial<OperationProgress>).kind === 'string'
  );
}

function progressEvent(operation: OperationImpl<unknown>, message?: string): DetoxProgressEvent {
  return {
    type: 'progress',
    name: operation.name,
    operation,
    message,
    timestamp: Date.now(),
  } as DetoxProgressEvent;
}

/** The launch-option fields that travel on the wire, only when present (validation is server-side). */
function launchWireFields(options: LaunchAppOptions): Record<string, unknown> {
  return {
    ...(options.launchArgs !== undefined ? { launchArgs: options.launchArgs } : {}),
    ...(options.languageAndLocale !== undefined ? { languageAndLocale: options.languageAndLocale } : {}),
    ...(options.url !== undefined ? { url: options.url } : {}),
    ...(options.sourceApp !== undefined ? { sourceApp: options.sourceApp } : {}),
    ...(options.userNotification !== undefined ? { userNotification: options.userNotification } : {}),
    ...(options.userActivity !== undefined ? { userActivity: options.userActivity } : {}),
    // readyTimeoutMs: 0 is a value, so presence is checked with !== undefined, not truthiness.
    ...(options.readyTimeoutMs !== undefined ? { readyTimeoutMs: options.readyTimeoutMs } : {}),
  };
}

/**
 * The driver's descriptor (`{udid}` on iOS, whatever a driver package
 * declares in its `AllocationMap` entry) is spread verbatim next to the
 * allocation's own fields — the client never names a platform id (spec 015).
 */
function toDeviceInfo(type: DeviceType, response: AllocateDeviceResponse): DeviceInfo {
  const descriptor = typeof response.device === 'object' && response.device !== null ? response.device : {};
  return {
    ...descriptor,
    allocationId: response.allocationId,
    name: response.name,
    os: response.os,
    type,
  } as DeviceInfo;
}
