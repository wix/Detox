import { randomUUID } from 'node:crypto';

import type { DetoxServerPeer } from './DetoxServerPeer';
import type { DriverHost } from './drivers';
import type { DeviceLease } from './driver';
import type { AppGateway, AppSession } from './AppGateway';
import { AbortError, DetoxError, DetoxErrorCode } from '@detox-remote/core';
import type {
  AllocateDeviceRequest,
  AllocateDeviceResponse,
  BootDeviceRequest,
  BootDeviceResponse,
  ClearKeychainParams,
  DeliverPayloadParams,
  DeviceActionParams,
  ForegroundAppParams,
  InstallAppParams,
  InvokeParams,
  InvokeResult,
  ReloadReactNativeParams,
  LaunchAppParams,
  LaunchAppResult,
  AttachAppParams,
  ActivateAppParams,
  AppHandleResult,
  ConnectedAppsParams,
  ConnectedAppsResult,
  MatchFaceParams,
  MatchFingerParams,
  OpenURLParams,
  OperationProgress,
  ResetContentAndSettingsParams,
  ResetStatusBarParams,
  SetBiometricEnrollmentParams,
  SetLocationParams,
  SetPermissionsParams,
  SetStatusBarParams,
  TerminateAppParams,
  ReleaseDeviceRequest,
  ReleaseDeviceResponse,
  SendToHomeParams,
  SetSyncSettingsParams,
  ShutdownDeviceRequest,
  ShutdownDeviceResponse,
  UninstallAppParams,
  UnmatchFaceParams,
  UnmatchFingerParams,
  WaitForActiveParams,
  WaitForBackgroundParams,
} from '@detox-remote/protocol';
import { isHttpUrl } from '@detox-remote/protocol';
import { fetchAndUnpackApp, unpackAppArchive } from './app-archive';
import { redactUrlForLog } from './redact';
import { DEFAULT_APP_OUTPUT_BUDGET_BYTES } from './app-output';
import { currentRequestTrace } from './request-scope';
import { SHA256_HEX_RE, type BlobStore } from './BlobStore';
import type { ConnectionTrace } from './ConnectionRecorder';
import { describeError, type LogLevel } from './log-sink';
import {
  disposeQuietly,
  materializePayload,
  serializePayloadValue,
  type MaterializedPayload,
} from './payloads';

/**
 * Launch handshake deadline (spawn → login → `ready`). Generous: the first
 * launch on a cold CoreSimulator runtime can take over 60 s; a warm launch
 * takes seconds.
 */
const LAUNCH_READY_TIMEOUT_MS = 120_000;

/** @issue DTX-6000: heartbeat cadence keeps a slow boot's silence under the relay's stall window. */
const BOOT_HEARTBEAT_MS = 10_000;

/** Allocation ids are the core's, one sequence across every connection and driver of this server life. */
let nextAllocationSeq = 1;

/**
 * The launch-arg keys `launchApp` refuses (spec 006): the frozen pair
 * whose displacement would silently repoint the app at another server, and the two payload
 * path keys that would smuggle a client path around the value rule. Not a blanket `detox*`
 * reservation: the corpus passes `detoxEnableSynchronization` and `detoxURLBlacklistRegex` as plain launch args.
 */
const RESERVED_LAUNCH_ARG_KEYS = [
  'detoxServer',
  'detoxSessionId',
  'detoxUserNotificationDataURL',
  'detoxUserActivityDataURL',
] as const;

/**
 * Launch fields from an earlier draft of the wire type, which declared them
 * and silently dropped them.
 * Spec 006 deletes them from the wire type; a params object still carrying one is
 * version-skewed and is told so, with where the capability went.
 */
const DEAD_LAUNCH_PARAM_KEYS: Record<string, string> = {
  newInstance: "a resume is the app handle's foreground(), never a launch option",
  permissions: 'permissions moved to their own device.setPermissions verb',
  delete: 'compose uninstallApp + installApp instead',
};

/** The exclusive at-launch/live payload fields (presence-based, spec 006). */
const PAYLOAD_PARAM_KEYS = ['url', 'userNotification', 'userActivity'] as const;

/** Client-machine path fields on `deliverPayload` from an earlier draft of the wire type: meaningless through a relay, so the value rule kills them; still sending one is version-skewed. */
const DEAD_PAYLOAD_PATH_KEYS = ['detoxUserNotificationDataURL', 'detoxUserActivityDataURL'] as const;

/** Configuration the embedding server hands down (spec 015: the drivers own device/framework config). */
export interface DetoxServerImplConfig {
  /** Test seam for the launch deadline; production uses the default. */
  launchReadyTimeoutMs?: number;
  /** `--app-output-budget` (spec 013): bytes of the app's own output stored per launch. */
  appOutputBudgetBytes?: number;
}

export interface DetoxServerImplDeps {
  serverPeer: DetoxServerPeer;
  /** The driver host (spec 015): `device.type` selects a driver, each with its own pool and per-device gateways. */
  driverHost: DriverHost;
  /** @issue DTX-6001: no blob store means install-by-blob refuses typed, not pretending. */
  blobStore?: BlobStore;
  config?: DetoxServerImplConfig;
  /** The connection's log (spec 012): narration lands under the request it belongs to, else under `conn`. */
  trace?: ConnectionTrace;
}

interface RequestContext {
  signal?: AbortSignal;
  progress?: (value: unknown) => void;
  /**
   * Registers a compensation for an effect that just landed — required, unlike `signal` and
   * `progress`: an absent ledger would make "nobody took the device back" silent and type-checked-away.
   */
  onUndo: (fn: () => void | Promise<void>) => void;
}

/** A pending `attach`, tracked on its allocation so a release rejects it `DETOX_STALE_HANDLE`. */
interface AttachWaiter {
  stale: boolean;
  markStale(): void;
}

interface Allocation {
  allocationId: string;
  /** The driver's hold on the device for this allocation (spec 015): its gateway and every verb. */
  lease: DeviceLease;
  startedAt: number;
  /** Last time a request touched this allocation — reported at release, never enforced. */
  lastActivity: number;
  /**
   * Physical operations (boot/shutdown) in flight on this device. Reclaim must not free the
   * device while one runs (spec 002).
   */
  pending: Set<Promise<unknown>>;
  /**
   * The handles this allocation minted, by server-minted handle id — one per (allocation,
   * session) (spec 015). Tombstones kept: an invoke on a dead handle answers `DETOX_APP_DIED`.
   */
  appsByHandle: Map<string, AppSession>;
  /** The reverse: a session's handle id within this allocation, so the same instance is one id. */
  handleBySession: Map<AppSession, string>;
  /** How to stop the app-output tail for a session (spec 013). */
  captures: Map<AppSession, () => void>;
  /**
   * Per-session launch counter: a rollback that outlives its answer must know whether its
   * process still answers to that session id (a later launch supersedes). Counts from the
   * start of a launch, so a relaunch still mid-handshake already claims it.
   */
  launchSeqBySession: Map<string, number>;
  /** In-flight `attach` waiters (spec 015): a release/reclaim of this allocation rejects them stale. */
  attachWaiters: Set<AttachWaiter>;
  /**
   * A wipe running on this device right now: every other request on the
   * allocation waits it out, then re-checks ownership — a wedged erase ends
   * the allocation. Settled-never-throwing so waiting on it is always safe.
   */
  wiping?: Promise<void>;
}

/** Hold age and idle age at release — for logs only. */
interface AllocationAges {
  heldMs: number;
  idleMs: number;
}

/** The `boot` child operation's narration hooks — see `_bootNarration`. */
interface BootNarration {
  began: boolean;
  onBootStart: () => void;
  end: (ok: boolean) => void;
}

/** The four things a biometric event needs; grouped so the handlers stay one-liners. */
interface BiometricEventArgs {
  params: DeviceActionParams;
  kind: 'face' | 'finger';
  matched: boolean;
  ctx: RequestContext;
}

/** What `_launchFailure` needs to classify a failed handshake. */
interface LaunchFailureArgs {
  err: unknown;
  bundleId: string;
  callerSignal: AbortSignal | undefined;
  /** Absent when the caller passed `readyTimeoutMs: 0` — no server clock exists. */
  deadline: AbortSignal | undefined;
}

const notImplementedError = (method: string): DetoxError =>
  new DetoxError(`${method} is not implemented by this device's driver`, {
    code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED,
    details: { method },
  });

export class DetoxServerImpl {
  private _serverPeer: DetoxServerPeer;
  private _driverHost: DriverHost;
  private _blobStore: BlobStore | undefined;
  private _config: DetoxServerImplConfig;
  private _trace: ConnectionTrace | undefined;
  private _allocations = new Map<string, Allocation>();
  private _released = false;

  constructor({ serverPeer, driverHost, blobStore, config = {}, trace }: DetoxServerImplDeps) {
    this._trace = trace;
    this._serverPeer = serverPeer;
    this._driverHost = driverHost;
    this._blobStore = blobStore;
    this._config = config;
    this._registerHandlers();
  }

  /**
   * The socket died. Terminal: hand everything back, and make sure an
   * allocation still in flight cannot re-register itself once it finishes.
   */
  release(): Promise<void> {
    this._released = true;
    // Identity in the log: "a client went silent" alone is not actionable on a multi-client server.
    if (this._allocations.size > 0) {
      this._say(undefined, 'info', `[server] connection closed — reclaiming ${this._allocations.size} device(s)`);
    }
    return this.releaseAll();
  }

  /**
   * @issue DTX-6002: reclaim honors the same barrier an explicit release does — a tracked
   * operation must settle before the device moves on. Not terminal, and not exposed as an RPC.
   */
  releaseAll(): Promise<void> {
    const reclaims: Promise<void>[] = [];
    for (const allocation of this._allocations.values()) {
      this._rejectAttachWaiters(allocation);
      if (allocation.pending.size > 0) {
        reclaims.push(Promise.allSettled([...allocation.pending]).then(() => this._reclaim(allocation)));
      } else {
        this._reclaim(allocation);
      }
    }
    this._allocations.clear();
    return Promise.all(reclaims).then(() => undefined);
  }

  private _reclaim(allocation: Allocation): void {
    // Release is a ledger entry: the device keeps its listener,
    // its sockets and sessions — nothing physical here, no socket closed.
    allocation.lease.release();
    const { heldMs, idleMs } = this._ages(allocation);
    this._say(undefined, 'info', `[server] reclaimed ${allocation.lease.id} (held ${heldMs}ms, idle ${idleMs}ms)`);
  }

  private _ages(allocation: Allocation): AllocationAges {
    const now = Date.now();
    return { heldMs: now - allocation.startedAt, idleMs: now - allocation.lastActivity };
  }

  /** A release or reclaim of an allocation rejects its pending `attach` waiters `DETOX_STALE_HANDLE` (spec 015). */
  private _rejectAttachWaiters(allocation: Allocation): void {
    for (const waiter of [...allocation.attachWaiters]) waiter.markStale();
    allocation.attachWaiters.clear();
  }

  /** Tracks a physical operation on the allocation for the reclaim barrier above. */
  private async _tracked<T>(allocation: Allocation, promise: Promise<T>): Promise<T> {
    allocation.pending.add(promise);
    try {
      return await promise;
    } finally {
      allocation.pending.delete(promise);
    }
  }

  private _registerHandlers(): void {
    this._serverPeer.onAllocateDevice(this._handleAllocateDevice.bind(this));
    this._serverPeer.onBootDevice(this._handleBootDevice.bind(this));
    this._serverPeer.onShutdownDevice(this._handleShutdownDevice.bind(this));
    this._serverPeer.onReleaseDevice(this._handleReleaseDevice.bind(this));
    this._serverPeer.onLaunchApp(this._handleLaunchApp.bind(this));
    this._serverPeer.onAttachApp(this._handleAttachApp.bind(this));
    this._serverPeer.onActivateApp(this._handleActivateApp.bind(this));
    this._serverPeer.onConnectedApps(this._handleConnectedApps.bind(this));
    this._serverPeer.onTerminateApp(this._handleTerminateApp.bind(this));
    this._serverPeer.onSendToHome(this._handleSendToHome.bind(this));

    // Launch options and app-state sync (spec 006).
    this._serverPeer.onSetPermissions(this._handleSetPermissions.bind(this));
    this._serverPeer.onForegroundApp(this._handleForegroundApp.bind(this));
    this._serverPeer.onWaitForActive(this._handleWaitForActive.bind(this));
    this._serverPeer.onWaitForBackground(this._handleWaitForBackground.bind(this));
    this._serverPeer.onDeliverPayload(this._handleDeliverPayload.bind(this));

    // The device-utilities toolbelt (spec 005).
    this._serverPeer.onUninstallApp(this._handleUninstallApp.bind(this));
    this._serverPeer.onOpenURL(this._handleOpenURL.bind(this));
    this._serverPeer.onSetLocation(this._handleSetLocation.bind(this));
    this._serverPeer.onSetStatusBar(this._handleSetStatusBar.bind(this));
    this._serverPeer.onResetStatusBar(this._handleResetStatusBar.bind(this));
    this._serverPeer.onSetBiometricEnrollment(this._handleSetBiometricEnrollment.bind(this));
    this._serverPeer.onMatchFace(this._handleMatchFace.bind(this));
    this._serverPeer.onUnmatchFace(this._handleUnmatchFace.bind(this));
    this._serverPeer.onMatchFinger(this._handleMatchFinger.bind(this));
    this._serverPeer.onUnmatchFinger(this._handleUnmatchFinger.bind(this));
    this._serverPeer.onClearKeychain(this._handleClearKeychain.bind(this));
    this._serverPeer.onResetContentAndSettings(this._handleResetContentAndSettings.bind(this));

    // @issue DTX-6003: an unwired action refuses typed DETOX_NOT_IMPLEMENTED, never a raw -32601.
    // @issue DTX-6004: ownership is checked before implementedness, via the same `_deviceAction` path.
    const notImplemented =
      (method: string) =>
      (params: DeviceActionParams): Promise<never> =>
        this._deviceAction(params, () => Promise.reject(notImplementedError(method)));
    this._serverPeer.onTakeScreenshot(notImplemented('takeScreenshot'));
    this._serverPeer.onReverseTcpPort(notImplemented('reverseTcpPort'));
    this._serverPeer.onUnreverseTcpPort(notImplemented('unreverseTcpPort'));

    // The app gateway (spec 003): install, launch-as-handshake, invoke.
    this._serverPeer.onInstallApp(this._handleInstallApp.bind(this));
    this._serverPeer.onInvoke(this._handleInvoke.bind(this));
    this._serverPeer.onReloadReactNative(this._handleReloadReactNative.bind(this));

    // Every app-channel verb spec 003 leaves unwired answers the typed refusal after ownership.
    this._serverPeer.onShake(notImplemented('shake'));
    this._serverPeer.onSetOrientation(notImplemented('setOrientation'));
    this._serverPeer.onSetSyncSettings(this._handleSetSyncSettings.bind(this));
    this._serverPeer.onCurrentStatus(notImplemented('currentStatus'));
    this._serverPeer.onCaptureViewHierarchy(notImplemented('captureViewHierarchy'));
    this._serverPeer.onGenerateViewHierarchyXml(notImplemented('generateViewHierarchyXml'));
  }

  private async _handleAllocateDevice(
    params: AllocateDeviceRequest,
    ctx: RequestContext,
  ): Promise<AllocateDeviceResponse> {
    const narrate = this._narrator(ctx);
    // Resolve the driver first: a reserved legacy name, a path-shaped
    // specifier, or a package that cannot be imported all answer
    // `DETOX_NO_MATCHING_DEVICE` (spec 015) — what frozen 002
    // pins, so the relay advances its fan-out on it.
    const { driver, type } = await this._driverHost.resolve(params.type);
    // `allocateDevice — query …` is contract-adjacent: frozen 013 finds this tick under the rpc.
    this._say(ctx, 'info', '[server] allocateDevice — query:', JSON.stringify(params.device ?? {}), 'type:', type);
    narrate({ op: 'allocateDevice', kind: 'progress', message: 'Looking for a matching device' });

    // The allocation id is the core's (one counter for every driver and
    // connection); the driver records its holder under it (spec 004 names
    // holders by it). The driver matches, claims and boots; a caller that
    // walks away mid-boot leaves nothing behind (spec 002's rollback), so the
    // ledger has nothing to undo until the lease is in hand.
    const allocationId = `alloc-${nextAllocationSeq++}`;
    const boot = this._bootNarration(ctx, () => `a matching ${type} device`);
    let lease: DeviceLease;
    try {
      lease = await driver.allocate({
        allocationId,
        device: params.device,
        requestedType: type,
        signal: ctx.signal,
        onBootStart: boot.onBootStart,
      });
    } catch (err) {
      boot.end(false);
      throw err;
    }
    boot.end(true);
    if (!boot.began) narrate({ op: 'allocateDevice', kind: 'progress', message: `${lease.info.name} was already booted` });
    this._say(ctx, 'info', '[server] allocateDevice — ready:', lease.id, boot.began ? '(booted)' : '(warm)');

    // @issue DTX-6007: the rollback is registered the moment there is a lease to unwind.
    ctx.onUndo(() => lease.discard());

    // @issue DTX-6005: refuses to hand over a device nobody will hear about.
    if (ctx.signal?.aborted || this._released) {
      throw new AbortError(ctx.signal?.reason);
    }

    const now = Date.now();
    const allocation: Allocation = {
      allocationId,
      lease,
      startedAt: now,
      lastActivity: now,
      pending: new Set(),
      appsByHandle: new Map(),
      handleBySession: new Map(),
      captures: new Map(),
      launchSeqBySession: new Map(),
      attachWaiters: new Set(),
    };
    this._allocations.set(allocationId, allocation);
    lease.onStateChange((state) => this._serverPeer.notifyDeviceStateChanged({ allocationId, state }));
    // @issue DTX-6008: the id stops addressing anything synchronously, then the reclaim barrier.
    // Release is a ledger entry: no gateway session is closed here.
    ctx.onUndo(async () => {
      const held = this._allocations.get(allocationId);
      if (!held) return;
      this._allocations.delete(allocationId);
      this._rejectAttachWaiters(held);
      if (held.pending.size > 0) {
        await Promise.allSettled(held.pending);
      }
    });
    return {
      allocationId,
      device: lease.info.device,
      name: lease.info.name,
      os: lease.info.os,
      state: 'booted',
      // The device's own app gateway (spec 015): alive with the booted device.
      apps: { serverUrl: lease.apps.url },
    };
  }

  /**
   * The `boot` child operation a driver's boot narrates (spec 002): `begin`
   * when the driver says a real boot is about to run, a heartbeat while it
   * runs (@issue DTX-6000: keeps a slow boot's silence under the relay's stall
   * window), `end` with the outcome. Nothing is narrated for a warm device.
   */
  private _bootNarration(ctx: RequestContext, label: () => string): BootNarration {
    const narrate = this._narrator(ctx);
    let heartbeat: NodeJS.Timeout | undefined;
    const narration: BootNarration = {
      began: false,
      onBootStart: () => {
        narration.began = true;
        narrate({ op: 'boot', kind: 'begin', message: `Booting ${label()}` });
        heartbeat = setInterval(() => {
          narrate({ op: 'boot', kind: 'progress', message: `Still booting ${label()}` });
        }, BOOT_HEARTBEAT_MS);
        heartbeat.unref();
      },
      end: (ok: boolean) => {
        if (heartbeat) clearInterval(heartbeat);
        heartbeat = undefined;
        if (narration.began) narrate({ op: 'boot', kind: 'end', ok });
      },
    };
    return narration;
  }

  private _handleBootDevice(
    params: BootDeviceRequest,
    ctx: RequestContext,
  ): Promise<BootDeviceResponse> {
    return this._deviceAction(params, async (deviceId, allocation) => {
      const { lease } = allocation;
      if (typeof lease.boot !== 'function') throw notImplementedError('boot');
      const narrate = this._narrator(ctx);
      this._say(ctx, 'info', '[server] bootDevice —', deviceId);
      narrate({ op: 'boot', kind: 'progress', message: `Booting ${deviceId}` });
      const didBoot = await lease.boot({ signal: ctx.signal });
      narrate({ op: 'boot', kind: 'progress', message: didBoot ? 'Boot finished' : 'Already booted' });
      return { state: 'booted' };
    });
  }

  private _handleShutdownDevice(
    params: ShutdownDeviceRequest,
    ctx: RequestContext,
  ): Promise<ShutdownDeviceResponse> {
    return this._deviceAction(params, async (deviceId, allocation) => {
      const { lease } = allocation;
      if (typeof lease.shutdown !== 'function') throw notImplementedError('shutdown');
      const narrate = this._narrator(ctx);
      this._say(ctx, 'info', '[server] shutdownDevice —', deviceId);
      narrate({ op: 'shutdown', kind: 'progress', message: `Shutting down ${deviceId}` });
      const didShutdown = await lease.shutdown({ signal: ctx.signal });
      narrate({
        op: 'shutdown',
        kind: 'progress',
        message: didShutdown ? 'Shutdown finished' : 'Already shut down',
      });
      return { state: 'shutdown' };
    });
  }

  private async _handleReleaseDevice(
    params: ReleaseDeviceRequest,
    ctx: RequestContext,
  ): Promise<ReleaseDeviceResponse> {
    const allocation = this._requireAllocation(params.allocationId);
    const narrate = this._narrator(ctx);
    const deviceId = allocation.lease.id;
    this._say(ctx, 'info', '[server] releaseDevice —', deviceId);
    narrate({ op: 'release', kind: 'progress', message: `Releasing ${deviceId}` });
    this._allocations.delete(params.allocationId);
    // A pending `attach` on this allocation is answered stale (spec 015): its device may go
    // to another owner, and the previous owner's handles are stale by `allocationId`.
    this._rejectAttachWaiters(allocation);
    // @issue DTX-6001: the reclaim barrier — a physical operation in flight must settle before the device moves on.
    if (allocation.pending.size > 0) {
      await Promise.allSettled(allocation.pending);
    }
    // Release closes nothing: the app a previous test left running is there for
    // the device's next owner. Instant on the wire; the driver's physical policy is its own.
    allocation.lease.release();
    const { heldMs, idleMs } = this._ages(allocation);
    this._say(ctx, 'info', `[server] released ${deviceId} (held ${heldMs}ms, idle ${idleMs}ms)`);
    return { released: true };
  }

  /**
   * The shape every device utility shares: ownership first,
   * then the subprocess work under the reclaim barrier.
   */
  private async _deviceAction<T>(
    params: DeviceActionParams,
    run: (deviceId: string, allocation: Allocation) => Promise<T>,
  ): Promise<T> {
    const allocation = this._requireAllocation(params.allocationId);
    return this._tracked(
      allocation,
      (async () => {
        if (allocation.wiping) {
          await allocation.wiping;
          this._requireAllocation(params.allocationId);
        }
        return run(allocation.lease.id, allocation);
      })(),
    );
  }

  /**
   * @issue DTX-6013: ownership check first, then the erase barrier — a stale handle hears
   * `DETOX_STALE_HANDLE` without waiting for anybody else's erase.
   */
  private async _ownedDevice(allocationId: string): Promise<Allocation> {
    const allocation = this._requireAllocation(allocationId);
    if (allocation.wiping) {
      await allocation.wiping;
      return this._requireAllocation(allocationId);
    }
    return allocation;
  }

  /**
   * A parameter the server refuses to guess at.
   */
  private _requireParam(method: string, name: string, value: unknown): void {
    if (value === undefined || value === null || value === '') {
      throw new DetoxError(`${method} requires a "${name}"`, {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { method, parameter: name },
      });
    }
  }

  private _handleUninstallApp(params: UninstallAppParams, ctx: RequestContext): Promise<void> {
    return this._deviceAction(params, (deviceId, allocation) => {
      this._requireParam('uninstallApp', 'appId', params.appId);
      if (typeof allocation.lease.uninstall !== 'function') throw notImplementedError('uninstallApp');
      this._say(ctx, 'info', '[server] uninstallApp —', params.appId, 'on', deviceId);
      return allocation.lease.uninstall({
        bundleId: params.appId as string,
        signal: ctx.signal,
      });
    });
  }

  private _handleOpenURL(params: OpenURLParams, ctx: RequestContext): Promise<void> {
    return this._deviceAction(params, (deviceId, allocation) => {
      this._requireParam('openURL', 'url', params.url);
      // @issue DTX-6014: sourceApp is refused, not silently dropped.
      if (params.sourceApp !== undefined) {
        throw new DetoxError('openURL on a device cannot honour "sourceApp" — hand the URL to the app handle instead', {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method: 'openURL', parameter: 'sourceApp' },
        });
      }
      if (typeof allocation.lease.openUrl !== 'function') throw notImplementedError('openURL');
      this._say(ctx, 'info', '[server] openURL — on', deviceId);
      return allocation.lease.openUrl({ url: params.url, signal: ctx.signal });
    });
  }

  private _handleSetLocation(params: SetLocationParams, ctx: RequestContext): Promise<void> {
    return this._deviceAction(params, (deviceId, allocation) => {
      for (const [name, value] of [['lat', params.lat], ['lon', params.lon]] as const) {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          throw new DetoxError(`setLocation requires a finite "${name}"`, {
            code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
            details: { method: 'setLocation', parameter: name, value },
          });
        }
      }
      // An absent capability is a typed refusal, never a live-looking no-op (spec 015, test 3).
      if (typeof allocation.lease.setLocation !== 'function') throw notImplementedError('setLocation');
      this._say(ctx, 'info', '[server] setLocation — on', deviceId);
      return allocation.lease.setLocation({ lat: params.lat, lon: params.lon, signal: ctx.signal });
    });
  }

  private _handleSetStatusBar(params: SetStatusBarParams, ctx: RequestContext): Promise<void> {
    return this._deviceAction(params, (deviceId, allocation) => {
      // @issue DTX-6033: named one by one, not spread-minus-allocationId.
      const overrides: Record<string, string | number | undefined> = {
        time: params.time,
        dataNetwork: params.dataNetwork,
        wifiMode: params.wifiMode,
        wifiBars: params.wifiBars,
        cellularMode: params.cellularMode,
        cellularBars: params.cellularBars,
        operatorName: params.operatorName,
        batteryState: params.batteryState,
        batteryLevel: params.batteryLevel,
      };
      if (typeof allocation.lease.setStatusBar !== 'function') throw notImplementedError('setStatusBar');
      this._say(ctx, 'info', '[server] setStatusBar — on', deviceId);
      return allocation.lease.setStatusBar({ overrides, signal: ctx.signal });
    });
  }

  private _handleResetStatusBar(params: ResetStatusBarParams, ctx: RequestContext): Promise<void> {
    return this._deviceAction(params, (deviceId, allocation) => {
      if (typeof allocation.lease.resetStatusBar !== 'function') throw notImplementedError('resetStatusBar');
      this._say(ctx, 'info', '[server] resetStatusBar — on', deviceId);
      return allocation.lease.resetStatusBar({ signal: ctx.signal });
    });
  }

  private _handleSetBiometricEnrollment(
    params: SetBiometricEnrollmentParams,
    ctx: RequestContext,
  ): Promise<void> {
    return this._deviceAction(params, (deviceId, allocation) => {
      if (typeof params.enabled !== 'boolean') {
        throw new DetoxError('setBiometricEnrollment requires a boolean "enabled"', {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method: 'setBiometricEnrollment', parameter: 'enabled' },
        });
      }
      if (typeof allocation.lease.setBiometricEnrollment !== 'function') throw notImplementedError('setBiometricEnrollment');
      this._say(ctx, 'info', '[server] setBiometricEnrollment —', params.enabled, 'on', deviceId);
      return allocation.lease.setBiometricEnrollment({ enabled: params.enabled, signal: ctx.signal });
    });
  }

  private _handleMatchFace(params: MatchFaceParams, ctx: RequestContext): Promise<void> {
    return this._biometricEvent({ params, kind: 'face', matched: true, ctx });
  }

  private _handleUnmatchFace(params: UnmatchFaceParams, ctx: RequestContext): Promise<void> {
    return this._biometricEvent({ params, kind: 'face', matched: false, ctx });
  }

  private _handleMatchFinger(params: MatchFingerParams, ctx: RequestContext): Promise<void> {
    return this._biometricEvent({ params, kind: 'finger', matched: true, ctx });
  }

  private _handleUnmatchFinger(params: UnmatchFingerParams, ctx: RequestContext): Promise<void> {
    return this._biometricEvent({ params, kind: 'finger', matched: false, ctx });
  }

  private _biometricEvent({ params, kind, matched, ctx }: BiometricEventArgs): Promise<void> {
    return this._deviceAction(params, (deviceId, allocation) => {
      if (typeof allocation.lease.matchBiometric !== 'function') throw notImplementedError(`${matched ? '' : 'un'}match${kind === 'face' ? 'Face' : 'Finger'}`);
      this._say(ctx, 'info', `[server] ${matched ? '' : 'un'}match ${kind} — on`, deviceId);
      return allocation.lease.matchBiometric({ kind, matched, signal: ctx.signal });
    });
  }

  private _handleClearKeychain(params: ClearKeychainParams, ctx: RequestContext): Promise<void> {
    return this._deviceAction(params, (deviceId, allocation) => {
      if (typeof allocation.lease.clearKeychain !== 'function') throw notImplementedError('clearKeychain');
      this._say(ctx, 'info', '[server] clearKeychain — on', deviceId);
      return allocation.lease.clearKeychain({ signal: ctx.signal });
    });
  }

  /**
   * The full wipe, v20-shaped: shutdown → erase → boot, all
   * driver-side, resolving to a live device.
   */
  private _handleResetContentAndSettings(
    params: ResetContentAndSettingsParams,
    ctx: RequestContext,
  ): Promise<void> {
    return this._deviceAction(params, (deviceId, allocation) => this._wipe(allocation, deviceId, ctx));
  }

  /**
   * The wipe is the driver's own choreography (spec 015; on iOS a
   * shutdown → erase → boot). The core keeps what is the core's: every other
   * request on the allocation waits the wipe out (`_deviceAction`), a wedged
   * step that left the device in an unknown state ends the allocation, and the
   * narration reaches the caller's progress channel.
   */
  private async _wipe(allocation: Allocation, deviceId: string, ctx: RequestContext): Promise<void> {
    const { lease } = allocation;
    const { signal } = ctx;
    const narrate = this._narrator(ctx);
    this._say(ctx, 'info', '[server] resetContentAndSettings —', deviceId);
    this._throwIfAborted(signal);
    if (typeof lease.resetContentAndSettings !== 'function') throw notImplementedError('resetContentAndSettings');

    const boot = this._bootNarration(ctx, () => deviceId);
    const wiping = lease.resetContentAndSettings({
      signal,
      onBootStart: boot.onBootStart,
      onProgress: (message) => narrate({ op: 'resetContentAndSettings', kind: 'progress', message }),
    });
    allocation.wiping = wiping.then(
      () => undefined,
      () => undefined,
    );
    try {
      await wiping;
      boot.end(true);
    } catch (err) {
      boot.end(false);
      throw this._noteUnknownState(allocation, err);
    } finally {
      allocation.wiping = undefined;
    }
  }

  /**
   * @issue DTX-6020: the allocation ends here; the driver has already fenced
   * the device off from its own picks.
   */
  private _noteUnknownState(allocation: Allocation, err: unknown): Error {
    if (err instanceof DetoxError && err.code === DetoxErrorCode.DETOX_DEVICE_UNKNOWN_STATE) {
      this._allocations.delete(allocation.allocationId);
      // The allocation is over: a pending `attach` on it is answered stale, as a release would.
      this._rejectAttachWaiters(allocation);
    }
    return err instanceof Error ? err : new Error(String(err));
  }

  /** @issue DTX-6018: the server's own abort rejection — never the caller's raw reason object. */
  private _throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) throw new AbortError(signal.reason);
  }

  /**
   * @issue DTX-6032: `installApp` speaks exactly two wire forms (spec 007) — an http(s) URL
   * XOR a blob address. A bare filesystem path is a version skew.
   */
  private _handleInstallApp(params: InstallAppParams, ctx: RequestContext): Promise<void> {
    return this._deviceAction(params, async (deviceId, allocation) => {
      if (typeof allocation.lease.install !== 'function') throw notImplementedError('installApp');
      const appPath = params.appPath ?? undefined;
      const blob = params.blob ?? undefined;
      if ((appPath === undefined) === (blob === undefined)) {
        throw new DetoxError(
          `installApp takes exactly one of "appPath" (an http(s) URL) or "blob" — got ${
            appPath === undefined ? 'neither' : 'both'
          }`,
          {
            code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
            details: { method: 'installApp' },
          },
        );
      }

      if (blob !== undefined) {
        return this._installByBlob(allocation, blob, ctx);
      }

      if (isHttpUrl(appPath as string)) {
        const url = appPath as string;
        const narrate = this._narrator(ctx);
        this._say(ctx, 'info', '[server] installApp (url) —', redactUrlForLog(url), 'on', deviceId);
        narrate({ op: 'installApp', kind: 'progress', message: `Fetching ${redactUrlForLog(url)}` });
        const fetched = await fetchAndUnpackApp(url, { signal: ctx.signal });
        try {
          narrate({ op: 'installApp', kind: 'progress', message: `Installing on ${deviceId}` });
          await allocation.lease.install({ appPath: fetched.appPath, signal: ctx.signal });
        } finally {
          await fetched.dispose();
        }
        return;
      }

      throw new DetoxError(
        'installApp no longer reads a server-local path — since the upload lane (spec 007) the ' +
          'client archives the bundle and uploads it by content hash. A filesystem path on the ' +
          'wire means this detox client is older than the server; update the client, or pass an ' +
          'http(s) archive URL.',
        {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method: 'installApp', appPath },
        },
      );
    });
  }

  /**
   * Install-by-blob (spec 007): pin the store entry against eviction for the whole read,
   * unpack it to a fresh temp dir, install, dispose the temp tree in all endings.
   */
  private async _installByBlob(
    allocation: Allocation,
    blob: NonNullable<InstallAppParams['blob']>,
    ctx: RequestContext,
  ): Promise<void> {
    const store = this._blobStore;
    if (!store) {
      throw new DetoxError('installApp by blob requires the blob store, which this server did not start', {
        code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED,
        details: { method: 'installApp' },
      });
    }
    if (blob.algo !== 'sha256') {
      throw new DetoxError(
        `installApp blob algo must be "sha256" — got ${JSON.stringify(blob.algo)} (a second algorithm is a value this server does not speak yet)`,
        {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method: 'installApp', algo: blob.algo },
        },
      );
    }
    if (typeof blob.hex !== 'string' || !SHA256_HEX_RE.test(blob.hex)) {
      throw new DetoxError('installApp blob hex must be a 64-character lowercase sha-256 digest', {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { method: 'installApp' },
      });
    }

    const shown = `sha256/${blob.hex}`;
    if (!store.pin(blob.hex)) {
      throw new DetoxError(
        `installApp: the server does not hold blob ${shown} — it may have been evicted; re-upload and retry`,
        {
          code: DetoxErrorCode.DETOX_APP_TRANSFER_FAILED,
          details: { method: 'installApp', blob: shown, reason: 'blob not in store' },
        },
      );
    }
    try {
      store.touch(blob.hex);
      const narrate = this._narrator(ctx);
      this._say(ctx, 'info', '[server] installApp (blob) —', shown, 'on', allocation.lease.id);
      narrate({ op: 'installApp', kind: 'progress', message: `Unpacking ${shown}` });
      const unpacked = await unpackAppArchive(store.pathOf(blob.hex), { signal: ctx.signal, shown });
      try {
        narrate({ op: 'installApp', kind: 'progress', message: `Installing on ${allocation.lease.id}` });
        await allocation.lease.install!({ appPath: unpacked.appPath, signal: ctx.signal });
      } finally {
        await unpacked.dispose();
      }
    } finally {
      store.unpin(blob.hex);
    }
  }

  /**
   * `launchApp` is a handshake, not a fire-and-forget (spec 003): the driver terminates any
   * live instance first, spawns with the frozen argv convention, then resolves only after the
   * app logged in and said `ready`. Always a fresh instance (spec 015 — resume is `activate`).
   */
  private _handleLaunchApp(
    params: LaunchAppParams,
    ctx: RequestContext,
  ): Promise<LaunchAppResult> {
    return this._deviceAction(params, (_deviceId, allocation) => this._launch(allocation, params, ctx));
  }

  private async _launch(
    allocation: Allocation,
    params: LaunchAppParams,
    ctx: RequestContext,
  ): Promise<LaunchAppResult> {
    const { lease } = allocation;
    const deviceId = lease.id;
    this._requireParam('launchApp', 'appId', params.appId);
    const bundleId = params.appId as string;
    if (typeof lease.launch !== 'function') throw notImplementedError('launchApp');
    // Validation precedes every side effect (spec 006).
    this._validateLaunchParams(params);
    const sessionId = lease.composeSessionId ? lease.composeSessionId(bundleId) : bundleId;
    const gateway = lease.apps;

    const notificationJson =
      params.userNotification !== undefined
        ? serializePayloadValue('userNotification', params.userNotification)
        : undefined;
    const activityJson =
      params.userActivity !== undefined
        ? serializePayloadValue('userActivity', params.userActivity)
        : undefined;
    this._say(ctx, 'info', '[server] launchApp —', bundleId, 'on', deviceId);

    // @issue DTX-6023: `0` is a branch, not a value — no server-side timeout.
    const deadline =
      params.readyTimeoutMs === 0
        ? undefined
        : AbortSignal.timeout(
            params.readyTimeoutMs ?? this._config.launchReadyTimeoutMs ?? LAUNCH_READY_TIMEOUT_MS,
          );
    const handshakeSignal = combineSignals(ctx.signal, deadline);

    // @issue DTX-6021: payloads materialize to the server's own files and are ledgered for rollback.
    const payloads: MaterializedPayload[] = [];
    ctx.onUndo(async () => {
      for (const payload of payloads) await payload.dispose();
    });
    const payloadArgs: Record<string, string> = {};
    if (params.url !== undefined) {
      payloadArgs.detoxURLOverride = params.url;
      if (params.sourceApp !== undefined) payloadArgs.detoxSourceAppOverride = params.sourceApp;
    }
    if (notificationJson !== undefined) {
      const payload = await materializePayload('userNotification', notificationJson);
      payloads.push(payload);
      payloadArgs.detoxUserNotificationDataURL = payload.path;
    }
    if (activityJson !== undefined) {
      const payload = await materializePayload('userActivity', activityJson);
      payloads.push(payload);
      payloadArgs.detoxUserActivityDataURL = payload.path;
    }

    const ourSeq = (allocation.launchSeqBySession.get(sessionId) ?? 0) + 1;
    allocation.launchSeqBySession.set(sessionId, ourSeq);

    // v20's supersede rule (spec 015), armed at the moment of the spawn — the driver's
    // `onSpawn`, after its terminate-first: the live session under the id is tombstoned (its
    // handle answers `DETOX_APP_DIED`) and the next login is claimed. Any earlier and the OLD
    // process, whose socket the tombstone closes, redials ~1 s later into the claim meant for
    // the new one; at spawn time it is dead, or never existed. Before the
    // spawn, so whichever of "launch returned" and "the app dialed in" comes first, the login
    // has a home.
    let pending: ReturnType<AppGateway['expectLogin']> | undefined;
    const armClaim = (): void => {
      if (pending) return;
      gateway.supersede(sessionId, 'superseded by a relaunch');
      pending = gateway.expectLogin(sessionId);
    };
    let pid: number | undefined;
    let session: AppSession | undefined;
    let stopOutput: (() => void) | undefined;
    const published: { appHandleId?: string } = {};
    ctx.onUndo(async () => {
      pending?.cancel();
      stopOutput?.();
      if (published.appHandleId) {
        allocation.appsByHandle.delete(published.appHandleId);
        if (session) allocation.handleBySession.delete(session);
      }
      session?.terminateSession('launch rolled back');
      if (pid === undefined || pid <= 0) {
        if (allocation.launchSeqBySession.get(sessionId) === ourSeq) {
          allocation.launchSeqBySession.set(sessionId, ourSeq - 1);
        }
        return;
      }
      if (allocation.launchSeqBySession.get(sessionId) !== ourSeq) {
        this._say(ctx, 'info', '[server] launchApp — rollback skipped, superseded:', bundleId);
        return;
      }
      // The driver's terminate is the compensation: it skips a device that has since moved to
      // another owner and waits out an in-flight erase of its own.
      if (allocation.wiping) await allocation.wiping;
      if (typeof lease.terminate === 'function') {
        await this._tracked(allocation, lease.terminate({ bundleId, tolerateDownDevice: true }));
      }
    });

    // The app's own stdout/stderr (spec 013): captured under this request's node, when a
    // request trace exists to write them to (the peer's handler scope; a bare unit harness has none).
    const trace = currentRequestTrace();
    const output = trace
      ? { sink: trace, budgetBytes: this._config.appOutputBudgetBytes ?? DEFAULT_APP_OUTPUT_BUDGET_BYTES }
      : undefined;
    try {
      const launched = await lease.launch({
        bundleId,
        sessionId,
        serverUrl: gateway.url,
        launchArgs: params.launchArgs,
        languageAndLocale: params.languageAndLocale,
        payloadArgs,
        output,
        signal: handshakeSignal,
        onSpawn: armClaim,
      });
      // A driver whose launch never signalled a spawn (it spawns nothing — the fake): the claim
      // is armed now, and the app is expected to dial in on its own.
      armClaim();
      pid = launched.pid;
      stopOutput = launched.stopOutput;
      session = await abortable(pending!.session, handshakeSignal);
      session.pid = pid;
      await abortable(session.ready, handshakeSignal);
    } catch (err) {
      stopOutput?.();
      throw this._launchFailure({ err, bundleId, callerSignal: ctx.signal, deadline });
    }

    // @issue DTX-6005: a cancellation landing during the handshake must not hand over an app
    // nobody will hear about — the ledger takes the launch back.
    if (ctx.signal?.aborted || this._released) {
      stopOutput?.();
      throw new AbortError(ctx.signal?.reason);
    }

    const appHandleId = this._mintHandle(allocation, session);
    published.appHandleId = appHandleId;
    for (const payload of payloads) {
      session.onDeath(() => disposeQuietly(payload));
    }
    if (stopOutput) {
      const stop = stopOutput;
      allocation.captures.set(session, stop);
      session.onDeath(stop);
    }
    this._say(ctx, 'info', '[server] launchApp — ready:', bundleId, 'pid', pid);
    return { pid: pid ?? 0, appHandleId };
  }

  /**
   * `device.apps.activate` (spec 015): if a session is connected and ready under the id,
   * foreground it (the driver's resume) and return its handle; else launch (killing whatever
   * uninstrumented instance may be up). A driver without resume refuses `DETOX_NOT_IMPLEMENTED`.
   */
  private _handleActivateApp(params: ActivateAppParams, ctx: RequestContext): Promise<AppHandleResult> {
    return this._deviceAction(params, async (deviceId, allocation) => {
      const { lease } = allocation;
      this._requireParam('activate', 'appId', params.appId);
      const bundleId = params.appId as string;
      const sessionId = lease.composeSessionId ? lease.composeSessionId(bundleId) : bundleId;
      const live = lease.apps.live(sessionId);
      if (live && live.isReady) {
        if (typeof lease.resume !== 'function') throw notImplementedError('activate');
        this._say(ctx, 'info', '[server] activate (resume) —', live.bundleId, 'on', deviceId);
        await this._tracked(allocation, lease.resume({ bundleId: live.bundleId, signal: ctx.signal }));
        await live.waitForActive({ signal: ctx.signal });
        return { appHandleId: this._mintHandle(allocation, live), bundleId: live.bundleId, pid: live.pid };
      }
      const launched = await this._launch(allocation, params, ctx);
      return { appHandleId: launched.appHandleId, bundleId, pid: launched.pid };
    });
  }

  /**
   * `device.apps.attach` (spec 015): resolves when a session is connected AND ready under
   * `sessionId` — at once if one already is, otherwise when one arrives. Never spawns. Wire
   * traffic, not a device mutation (not `_tracked`); a release/reclaim rejects it stale.
   */
  private async _handleAttachApp(params: AttachAppParams, ctx: RequestContext): Promise<AppHandleResult> {
    // Ownership and waiter registration are synchronous, before any await, so a
    // release racing this attach on the same connection always finds the
    // waiter and rejects it stale (spec 015) — never leaves it hanging.
    const allocation = this._requireAllocation(params.allocationId);
    this._requireParam('attach', 'sessionId', params.sessionId);
    const sessionId = params.sessionId;

    const ac = new AbortController();
    const waiter: AttachWaiter = {
      stale: false,
      markStale: () => {
        waiter.stale = true;
        ac.abort();
      },
    };
    allocation.attachWaiters.add(waiter);
    const signal = combineSignals(ctx.signal, ac.signal);
    try {
      // The wipe barrier, after the waiter is registered (a wedged erase may
      // end the allocation — the waiter is rejected stale then, like a release).
      if (allocation.wiping) {
        await allocation.wiping;
        this._requireAllocation(params.allocationId);
      }
      const session = await allocation.lease.apps.waitForReady(sessionId, { signal });
      return { appHandleId: this._mintHandle(allocation, session), bundleId: session.bundleId, pid: session.pid };
    } catch (err) {
      if (waiter.stale) {
        throw new DetoxError('the allocation that requested this attach was released', {
          code: DetoxErrorCode.DETOX_STALE_HANDLE,
          details: { allocationId: params.allocationId },
        });
      }
      throw err;
    } finally {
      allocation.attachWaiters.delete(waiter);
    }
  }

  /** `device.apps.connected` (spec 015): the device's ready sessions as handles. */
  private async _handleConnectedApps(
    params: ConnectedAppsParams,
    ctx: RequestContext,
  ): Promise<ConnectedAppsResult> {
    const allocation = await this._ownedDevice(params.allocationId);
    const apps = allocation.lease.apps.connected().map((session) => ({
      appHandleId: this._mintHandle(allocation, session),
      bundleId: session.bundleId,
      pid: session.pid,
    }));
    void ctx;
    return { apps };
  }

  /** One handle id per (allocation, session): minted the first time an allocation hears of a session (spec 015). */
  private _mintHandle(allocation: Allocation, session: AppSession): string {
    const existing = allocation.handleBySession.get(session);
    if (existing) return existing;
    const id = randomUUID();
    allocation.appsByHandle.set(id, session);
    allocation.handleBySession.set(session, id);
    return id;
  }

  /**
   * Names the failure honestly: the caller's abort stays the uniform typed abort; the deadline
   * expiring is the app's failure to complete the handshake — `DETOX_APP_DIED`.
   */
  private _launchFailure({ err, bundleId, callerSignal, deadline }: LaunchFailureArgs): Error {
    if (callerSignal?.aborted) {
      return new AbortError(callerSignal.reason);
    }
    if (deadline?.aborted && (err instanceof AbortError || !(err instanceof DetoxError))) {
      return new DetoxError(
        `launchApp: ${bundleId} never completed the launch handshake — the app did not ` +
          'connect and report ready in time (is the Detox instrumentation injected?)',
        { code: DetoxErrorCode.DETOX_APP_DIED, details: { bundleId } },
      );
    }
    return err instanceof Error ? err : new Error(String(err));
  }

  /**
   * Every launch-option refusal, in one place, before any side effect (spec 006).
   */
  private _validateLaunchParams(params: LaunchAppParams): void {
    const raw = params as unknown as Record<string, unknown>;
    for (const [key, successor] of Object.entries(DEAD_LAUNCH_PARAM_KEYS)) {
      if (raw[key] !== undefined) {
        throw new DetoxError(
          `launchApp no longer speaks "${key}" — this detox client predates spec 006 (${successor})`,
          {
            code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
            details: { method: 'launchApp', parameter: key, versionSkew: true },
          },
        );
      }
    }
    if (params.launchArgs !== undefined) {
      for (const key of RESERVED_LAUNCH_ARG_KEYS) {
        if (Object.prototype.hasOwnProperty.call(params.launchArgs, key)) {
          throw new DetoxError(
            `launchArgs.${key} is reserved: the frozen server/session pair may not be displaced, ` +
              'and payloads cross as values, never as paths (spec 006)',
            {
              code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
              details: { method: 'launchApp', parameter: key },
            },
          );
        }
      }
      for (const key of Object.keys(params.launchArgs)) {
        if (key.startsWith('-')) {
          throw new DetoxError(
            `launchArgs keys may not start with "-" (they are rendered as -key on argv) — got "${key}"`,
            {
              code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
              details: { method: 'launchApp', parameter: key },
            },
          );
        }
      }
    }
    this._validatePayloadFields('launchApp', raw);
    if (raw.readyTimeoutMs !== undefined) {
      const readyTimeoutMs = raw.readyTimeoutMs;
      if (
        typeof readyTimeoutMs !== 'number' ||
        !Number.isInteger(readyTimeoutMs) ||
        readyTimeoutMs < 0 ||
        readyTimeoutMs > 2 ** 31 - 1
      ) {
        throw new DetoxError(
          `launchApp readyTimeoutMs must be a whole number of milliseconds between 0 (no server-side timeout) and ${String(2 ** 31 - 1)} — got ${JSON.stringify(readyTimeoutMs)}`,
          {
            code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
            details: { method: 'launchApp', parameter: 'readyTimeoutMs' },
          },
        );
      }
    }
  }

  /**
   * @issue DTX-6026: the payload trio's shared rules (spec 006).
   */
  private _validatePayloadFields(method: string, raw: Record<string, unknown>): void {
    const present = PAYLOAD_PARAM_KEYS.filter((key) => raw[key] !== undefined);
    if (present.length > 1) {
      throw new DetoxError(
        `${method} takes at most one of url / userNotification / userActivity — got ${present.join(' + ')}`,
        {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method, parameters: present },
        },
      );
    }
    if (raw.url !== undefined && (typeof raw.url !== 'string' || raw.url === '')) {
      throw new DetoxError(
        `${method} url must be a non-empty string — v20 silently ignored an empty url; here it is its own refusal`,
        {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method, parameter: 'url' },
        },
      );
    }
    if (typeof raw.url === 'string' && /\s/.test(raw.url)) {
      throw new DetoxError(
        `${method} url may not contain whitespace — the app-side URL parser would crash the app on it`,
        {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method, parameter: 'url' },
        },
      );
    }
    if (raw.sourceApp !== undefined && raw.url === undefined) {
      throw new DetoxError(
        `${method} sourceApp rides only with url (the open-URL payload) — alone it would be silently meaningless`,
        {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method, parameter: 'sourceApp' },
        },
      );
    }
    if (raw.sourceApp !== undefined && typeof raw.sourceApp !== 'string') {
      throw new DetoxError(`${method} sourceApp must be a string`, {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { method, parameter: 'sourceApp' },
      });
    }
    for (const kind of ['userNotification', 'userActivity'] as const) {
      const value = raw[kind];
      if (value !== undefined && (typeof value !== 'object' || value === null || Array.isArray(value))) {
        throw new DetoxError(`${method} ${kind} must be a JSON object (the payload value, never a path)`, {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method, parameter: kind },
        });
      }
    }
  }

  /**
   * `device.setPermissions` (spec 006): its own verb. No rollback — permissions are state.
   */
  private _handleSetPermissions(params: SetPermissionsParams, ctx: RequestContext): Promise<void> {
    return this._deviceAction(params, (deviceId, allocation) => {
      this._requireParam('setPermissions', 'appId', params.appId);
      this._requireParam('setPermissions', 'permissions', params.permissions);
      const permissions = params.permissions as Record<string, string>;
      if (typeof permissions !== 'object' || Array.isArray(permissions)) {
        throw new DetoxError('setPermissions requires an object "permissions" map', {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method: 'setPermissions', parameter: 'permissions' },
        });
      }
      if (Object.keys(permissions).length === 0) {
        throw new DetoxError('setPermissions requires at least one service in "permissions"', {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method: 'setPermissions', parameter: 'permissions' },
        });
      }
      if (typeof allocation.lease.setPermissions !== 'function') throw notImplementedError('setPermissions');
      this._say(ctx, 'info', '[server] setPermissions —', params.appId, 'on', deviceId);
      return allocation.lease.setPermissions({
        bundleId: params.appId as string,
        permissions,
        signal: ctx.signal,
      });
    });
  }

  /**
   * @issue DTX-6028: `app.foreground()` is a resume, never a launch.
   */
  private async _handleForegroundApp(params: ForegroundAppParams, ctx: RequestContext): Promise<void> {
    const allocation = await this._ownedDevice(params.allocationId);
    const session = this._liveAppSession(allocation, params.appHandleId);
    if (typeof allocation.lease.resume !== 'function') throw notImplementedError('foreground');
    this._say(ctx, 'info', '[server] foregroundApp —', session.bundleId, 'on', allocation.lease.id);
    await this._tracked(
      allocation,
      allocation.lease.resume({ bundleId: session.bundleId, signal: ctx.signal }),
    );
    await session.waitForActive({ signal: ctx.signal });
  }

  private async _handleWaitForActive(params: WaitForActiveParams, ctx: RequestContext): Promise<void> {
    const allocation = await this._ownedDevice(params.allocationId);
    const session = this._liveAppSession(allocation, params.appHandleId);
    await session.waitForActive({ signal: ctx.signal });
  }

  private async _handleWaitForBackground(
    params: WaitForBackgroundParams,
    ctx: RequestContext,
  ): Promise<void> {
    const allocation = await this._ownedDevice(params.allocationId);
    const session = this._liveAppSession(allocation, params.appHandleId);
    await session.waitForBackground({ signal: ctx.signal });
  }

  /**
   * Live payload delivery (spec 006).
   */
  private async _handleDeliverPayload(params: DeliverPayloadParams, ctx: RequestContext): Promise<void> {
    const allocation = await this._ownedDevice(params.allocationId);
    const session = this._liveAppSession(allocation, params.appHandleId);
    const raw = params as unknown as Record<string, unknown>;
    for (const key of DEAD_PAYLOAD_PATH_KEYS) {
      if (raw[key] !== undefined) {
        throw new DetoxError(
          `deliverPayload no longer takes "${key}" — payloads cross as VALUES since spec 006; ` +
            'this detox client predates the server',
          {
            code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
            details: { method: 'deliverPayload', parameter: key, versionSkew: true },
          },
        );
      }
    }
    this._validatePayloadFields('deliverPayload', raw);
    const present = PAYLOAD_PARAM_KEYS.filter((key) => raw[key] !== undefined);
    if (present.length === 0) {
      throw new DetoxError(
        'deliverPayload requires exactly one of url / userNotification / userActivity',
        {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method: 'deliverPayload' },
        },
      );
    }

    const frame: Record<string, unknown> = {};
    let payload: MaterializedPayload | undefined;
    if (params.url !== undefined) {
      frame.url = params.url;
      if (params.sourceApp !== undefined) frame.sourceApp = params.sourceApp;
    } else {
      const kind = params.userNotification !== undefined ? 'userNotification' : 'userActivity';
      const json = serializePayloadValue(kind, raw[kind]);
      payload = await materializePayload(kind, json);
      const owed = payload;
      session.onDeath(() => disposeQuietly(owed));
      frame[kind === 'userNotification' ? 'detoxUserNotificationDataURL' : 'detoxUserActivityDataURL'] =
        payload.path;
    }
    if (params.delayPayload === true) frame.delayPayload = true;
    this._say(ctx, 'info', '[server] deliverPayload —', session.bundleId, 'on', allocation.lease.id);
    await session.deliverPayload(frame, { signal: ctx.signal });
    if (payload && params.delayPayload !== true) disposeQuietly(payload);
  }

  /**
   * Sync settings (parity): v20's `enableSynchronization`/`disableSynchronization`/
   * `setURLBlacklist` all ride the frozen `setSyncSettings` frame.
   */
  private async _handleSetSyncSettings(params: SetSyncSettingsParams, ctx: RequestContext): Promise<void> {
    const allocation = await this._ownedDevice(params.allocationId);
    const session = this._liveAppSession(allocation, params.appHandleId);
    const frame: Record<string, unknown> = {};
    if (params.enabled !== undefined) {
      if (typeof params.enabled !== 'boolean') {
        throw new DetoxError('setSyncSettings "enabled" must be a boolean', {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method: 'setSyncSettings', parameter: 'enabled', value: params.enabled },
        });
      }
      frame.enabled = params.enabled;
    }
    if (params.blacklistURLs !== undefined) {
      if (
        !Array.isArray(params.blacklistURLs) ||
        params.blacklistURLs.some((pattern) => typeof pattern !== 'string')
      ) {
        throw new DetoxError('setSyncSettings "blacklistURLs" must be an array of strings', {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method: 'setSyncSettings', parameter: 'blacklistURLs' },
        });
      }
      frame.blacklistURLs = params.blacklistURLs;
    }
    if (Object.keys(frame).length === 0) {
      throw new DetoxError('setSyncSettings requires "enabled" and/or "blacklistURLs"', {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { method: 'setSyncSettings' },
      });
    }
    this._say(ctx, 'info', '[server] setSyncSettings —', session.bundleId, 'on', allocation.lease.id);
    await session.setSyncSettings(frame, { signal: ctx.signal });
  }

  /**
   * The element channel (spec 003): relays the frozen-dialect invocation to the app session.
   */
  private async _handleInvoke(params: InvokeParams, ctx: RequestContext): Promise<InvokeResult> {
    const allocation = await this._ownedDevice(params.allocationId);
    this._requireParam('invoke', 'invocation', params.invocation);
    if (typeof params.invocation !== 'object' || Array.isArray(params.invocation)) {
      throw new DetoxError('invoke requires an object "invocation"', {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { method: 'invoke', parameter: 'invocation' },
      });
    }
    const session = this._liveAppSession(allocation, params.appHandleId);
    return session.invoke(params.invocation, { signal: ctx.signal });
  }

  private async _handleReloadReactNative(
    params: ReloadReactNativeParams,
    ctx: RequestContext,
  ): Promise<void> {
    const allocation = await this._ownedDevice(params.allocationId);
    const session = this._liveAppSession(allocation, params.appHandleId);
    this._say(ctx, 'info', '[server] reloadReactNative —', session.bundleId, 'on', allocation.lease.id);
    await session.reloadReactNative({ signal: ctx.signal });
  }

  /**
   * `terminate` through an app handle kills the OS process, closes that gateway session, and
   * invalidates exactly that handle (spec 003).
   */
  private async _handleTerminateApp(
    params: TerminateAppParams,
    ctx: RequestContext,
  ): Promise<void> {
    await this._deviceAction(params, async (deviceId, allocation) => {
      const { lease } = allocation;
      if (params.appHandleId !== undefined) {
        const session = this._liveAppSession(allocation, params.appHandleId);
        this._say(ctx, 'info', '[server] terminateApp —', session.bundleId, 'on', deviceId);
        if (typeof lease.terminate === 'function') {
          await lease.terminate({ bundleId: session.bundleId, signal: ctx.signal });
        }
        // Drain the app's output before this answer goes out (spec 013).
        allocation.captures.get(session)?.();
        session.terminateSession('terminated');
        return;
      }
      this._requireParam('terminateApp', 'appId', params.appId);
      const bundleId = params.appId as string;
      this._say(ctx, 'info', '[server] terminateApp —', bundleId, 'on', deviceId);
      if (typeof lease.terminate === 'function') {
        await lease.terminate({ bundleId, signal: ctx.signal });
      }
      for (const session of lease.apps.allLive()) {
        if (session.bundleId !== bundleId || session.dead) continue;
        allocation.captures.get(session)?.();
        session.terminateSession('terminated');
      }
    });
  }

  /**
   * @issue DTX-6029: app-handle liveness, after ownership.
   */
  private _liveAppSession(allocation: Allocation, appHandleId: string): AppSession {
    this._requireParam('appAction', 'appHandleId', appHandleId);
    const session = allocation.appsByHandle.get(appHandleId);
    if (!session || session.dead) {
      throw new DetoxError('The app behind this handle is gone', {
        code: DetoxErrorCode.DETOX_APP_DIED,
        details: { appHandleId },
      });
    }
    return session;
  }

  private async _handleSendToHome(
    params: SendToHomeParams,
    ctx: RequestContext,
  ): Promise<void> {
    await this._deviceAction(params, (deviceId, allocation) => {
      if (typeof allocation.lease.sendToHome !== 'function') throw notImplementedError('sendToHome');
      this._say(ctx, 'info', '[server] sendToHome — on', deviceId);
      return allocation.lease.sendToHome({ signal: ctx.signal });
    });
  }

  private _requireAllocation(allocationId: string): Allocation {
    const allocation = this._allocations.get(allocationId);
    if (!allocation) {
      throw new DetoxError(`Unknown allocation: ${allocationId}`, {
        code: DetoxErrorCode.DETOX_STALE_HANDLE,
        details: { allocationId },
      });
    }
    allocation.lastActivity = Date.now();
    return allocation;
  }

  private _narrator(ctx: RequestContext): (value: OperationProgress) => void {
    return (value) => ctx.progress?.(value);
  }

  /**
   * The server's own prose about a request, into the connection log.
   */
  private _say(ctx: RequestContext | undefined, level: LogLevel, ...parts: unknown[]): void {
    const message = parts
      .map((part) => (typeof part === 'string' ? part : part instanceof Error ? describeError(part) : JSON.stringify(part)))
      .join(' ')
      .replace(/^\[server\] /, '');
    this._trace?.narrate(ctx?.signal, level, message);
  }
}

/** Awaits `promise` unless `signal` fires first. */
function abortable<T>(promise: Promise<T>, signal: AbortSignal | undefined): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(new AbortError(signal.reason));
  return new Promise<T>((resolve, reject) => {
    const onAbort = (): void => reject(new AbortError(signal.reason));
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

/** Composes two optional abort signals into one (or none). */
function combineSignals(
  a: AbortSignal | undefined,
  b: AbortSignal | undefined,
): AbortSignal | undefined {
  if (a && b) return AbortSignal.any([a, b]);
  return a ?? b;
}
