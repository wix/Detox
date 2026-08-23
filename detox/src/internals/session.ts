/**
 * The living half of `detox/internals`: a session (root {@link Detox} handle)
 * over one WebSocket to a Detox Server, and the device handles it hands out.
 */
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
  DetoxCallOptions,
  DetoxDevice,
  DetoxInitOptions,
  DetoxOperation,
  DetoxOperationName,
  DetoxOperationRef,
  DetoxProgressEvent,
  DetoxServerAddress,
  LaunchAppOptions,
  StatusBarOverrides,
  DeviceInfo,
  DeviceInfoOf,
  DeviceState,
  DeviceType,
} from '../internals';
import { AbortError, DetoxConnectionError, DetoxErrorCode } from './errors';
import { DetoxAppImpl } from './app';
import { OperationImpl, OperationRegistry } from './operations';
import { BlobLaneClient, archiveAppBundle, ensureBlobUploaded } from './blob-upload';

/**
 * The runner-integration door (@internal — never public API): the compat
 * surface smuggles these two knobs in on the options object it builds
 * itself. `ambient` is sampled at every operation's creation and composed
 * like a session signal; `unrefSocket` keeps an idle session from holding a
 * jest worker's event loop open. Neither is declared on {@link DetoxInitOptions}
 * — `specs/**` never names them, and the public type stays clean.
 */
interface InternalInitOptions {
  ambient?: () => AbortSignal | undefined;
  unrefSocket?: boolean;
}

/** The underlying net.Socket handle `ws` keeps private — reached only to unref it. */
interface UnrefableNetSocket {
  unref?: () => void;
}

interface WsWithNetSocket {
  _socket?: UnrefableNetSocket;
}

export async function initSession(options: DetoxInitOptions): Promise<Detox> {
  const address: DetoxServerAddress =
    typeof options.server === 'string' ? { url: options.server } : options.server;
  const internal = options as DetoxInitOptions & InternalInitOptions;
  const registry = new OperationRegistry(options.signal, internal.ambient);

  // Connecting is itself an operation — no handle exists yet to subscribe to,
  // so it narrates through `options.onProgress` only.
  const socket = await registry.run<WebSocket>('connect', {
    onProgress: options.onProgress,
    execute: (operation) => connectWebSocket(address, operation.signal),
  });

  if (internal.unrefSocket === true) {
    // An idle session must never be the reason a jest worker (or an in-band
    // main process) cannot exit; the peer's retention sweeper is unref'd
    // already, so the TCP socket is the last live handle.
    (socket as unknown as WsWithNetSocket)._socket?.unref?.();
  }

  return new DetoxSession({
    socket,
    registry,
    address,
    signal: options.signal,
    ambient: internal.ambient,
  });
}

/** The slice of the refused handshake's HTTP response we actually read. */
interface HandshakeResponse {
  statusCode?: number;
}

function connectWebSocket(address: DetoxServerAddress, signal: AbortSignal): Promise<WebSocket> {
  if (signal.aborted) {
    return Promise.reject(new AbortError(signal.reason));
  }
  const socket = new WebSocket(address.url, { headers: address.headers });
  return new Promise<WebSocket>((resolve, reject) => {
    const onOpen = () => {
      cleanup();
      resolve(socket);
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
        'set client.token in the detox config or DETOX_SESSION_TOKEN';
}

interface DetoxSessionInit {
  socket: WebSocket;
  registry: OperationRegistry;
  /** Where the server lives — the blob lane dials the same address over HTTP. */
  address: DetoxServerAddress;
  signal?: AbortSignal;
  /** The runner-integration ambient provider (@internal) — see {@link initSession}. */
  ambient?: () => AbortSignal | undefined;
}

class DetoxSession implements Detox {
  readonly #channel: WebSocketChannel;
  readonly #client: DetoxClientPeer;
  readonly #registry: OperationRegistry;
  readonly #blobLane: BlobLaneClient;
  readonly #sessionSignal: AbortSignal | undefined;
  readonly #ambient: (() => AbortSignal | undefined) | undefined;
  readonly #devices = new Map<string, DetoxDeviceImpl>();
  /**
   * @issue DTX-3007: pushes that arrive before their device handle exists
   * are queued here and applied once it's registered.
   */
  readonly #earlyStates = new Map<string, DeviceRuntimeState>();
  #closing: Promise<void> | undefined;

  constructor({ socket, registry, address, signal, ambient }: DetoxSessionInit) {
    this.#channel = createWebSocketChannel(socket);
    this.#client = new DetoxClientPeer({ peer: Peer.create(this.#channel) });
    this.#registry = registry;
    this.#blobLane = new BlobLaneClient(address);
    this.#sessionSignal = signal;
    this.#ambient = ambient;

    // The version announce: a server speaking a different wire protocol is
    // refused here, typed, before its frames can mean the wrong thing. The
    // close code settles every pending and future call as
    // DETOX_VERSION_SKEW instead of a bare "connection lost". No clock and no
    // handshake barrier: a server that never announces is an older one,
    // tolerated at alpha.
    this.#client.onServerInfo(({ protocol, server }) => {
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
          { type: options.type, device: toWireQuery(options) },
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

  constructor({ deps, type, response }: DeviceInit) {
    this.#deps = deps;
    this.info = toDeviceInfo(type, response);
    this.#state = response.state;
  }

  get state(): DeviceState {
    return this.#state;
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

  launchApp(bundleId: string, options: LaunchAppOptions = {}): DetoxOperation<DetoxApp, 'launchApp'> {
    return this.#call('launchApp', options, async (op) => {
      // @issue DTX-3016: options travel verbatim, and only when present — validation is server-side.
      const { pid, appHandleId } = await this.#deps.client.launchApp(
        {
          allocationId: this.info.allocationId,
          appId: bundleId,
          ...(options.launchArgs !== undefined ? { launchArgs: options.launchArgs } : {}),
          ...(options.languageAndLocale !== undefined
            ? { languageAndLocale: options.languageAndLocale }
            : {}),
          ...(options.url !== undefined ? { url: options.url } : {}),
          ...(options.sourceApp !== undefined ? { sourceApp: options.sourceApp } : {}),
          ...(options.userNotification !== undefined
            ? { userNotification: options.userNotification }
            : {}),
          ...(options.userActivity !== undefined ? { userActivity: options.userActivity } : {}),
          // deadlineMs: 0 is a value, so presence is checked with
          // !== undefined, not truthiness.
          ...(options.deadlineMs !== undefined ? { deadlineMs: options.deadlineMs } : {}),
        },
        this.#wireOptions(op),
      );
      return new DetoxAppImpl({
        client: this.#deps.client,
        registry: this.#deps.registry,
        routeWireProgress: this.#deps.routeWireProgress,
        allocationId: this.info.allocationId,
        appHandleId,
        bundleId,
        pid,
        sessionSignal: this.#deps.sessionSignal,
        ambient: this.#deps.ambient,
      });
    }) as DetoxOperation<DetoxApp, 'launchApp'>;
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

/** The applesimutils-flavoured device query the server understands. */
interface WireDeviceQuery {
  id?: string;
  type?: string;
  os?: string;
}

function toWireQuery(options: AllocateDeviceOptions): WireDeviceQuery | undefined {
  const query = options.device;
  if (!query) return undefined;
  // @issue DTX-3008: the public dialect's `model` maps to applesimutils' `type`.
  return {
    ...(query.deviceId ? { id: query.deviceId } : {}),
    ...(query.model ? { type: query.model } : {}),
    ...(query.os ? { os: query.os } : {}),
  };
}

interface UdidResponse {
  udid: string;
}

interface AdbNameResponse {
  adbName: string;
}

function toDeviceInfo(type: DeviceType, response: AllocateDeviceResponse): DeviceInfo {
  const base = {
    allocationId: response.allocationId,
    name: response.name,
    os: response.os,
  };
  if (type === 'ios.simulator' || type === 'ios.device') {
    return { ...base, type, udid: (response.device as UdidResponse).udid };
  }
  return { ...base, type, adbName: (response.device as AdbNameResponse).adbName };
}
