import { randomUUID } from 'node:crypto';

import type { DetoxServerPeer } from './DetoxServerPeer';
import type { DevicePool } from './DevicePool';
import type { SimulatorOps } from './SimulatorOps';
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
  DeviceInfo,
  ForegroundAppParams,
  InstallAppParams,
  InvokeParams,
  InvokeResult,
  ReloadReactNativeParams,
  LaunchAppParams,
  LaunchAppResult,
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
import { TEARDOWN_TIMEOUT_MS, unknownStateIfKilled, type StatusBarOverrides } from './SimulatorOps';
import { isHttpUrl } from '@detox-remote/protocol';
import { fetchAndUnpackApp, redactUrlForLog, unpackAppArchive } from './app-archive';
import { SHA256_HEX_RE, type BlobStore } from './BlobStore';
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

/** App-gateway configuration the embedding server hands down. */
export interface AppGatewayConfig {
  /** Injectable Detox framework binary (`DETOX_IOS_FRAMEWORK_PATH`). */
  iosFrameworkPath?: string;
  /** Test seam for the launch deadline; production uses the default. */
  launchReadyTimeoutMs?: number;
}

export interface DetoxServerImplDeps {
  serverPeer: DetoxServerPeer;
  devicePool: DevicePool;
  simulatorOps: SimulatorOps;
  /** The app-facing listener (spec 003). Optional: without it, `launchApp`/`invoke` refuse typed `DETOX_NOT_IMPLEMENTED`. */
  appGateway?: AppGateway;
  /** @issue DTX-6001: no blob store means install-by-blob refuses typed, not pretending. */
  blobStore?: BlobStore;
  config?: AppGatewayConfig;
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

interface Allocation {
  allocationId: string;
  udid: string;
  /** This allocation created its simulator — a rollback must delete, not shut down. */
  created: boolean;
  /**
   * Physical operations (boot/shutdown) in flight on this device. Reclaim must not free the
   * udid while one runs: an aborted boot's compensating shutdown settles inside the same
   * promise, and releasing before it does would hand an instant rerun a device still shutting down (spec 002).
   */
  pending: Set<Promise<unknown>>;
  /**
   * Live and dead app sessions this allocation launched, by server-minted handle id (spec 003).
   * Dead sessions stay as tombstones so an invoke on a dead handle answers `DETOX_APP_DIED`,
   * not "unknown id" — a relaunch mints a new id and never revives the old one.
   */
  apps: Map<string, AppSession>;
  /**
   * The server itself performed the last physical boot of this device with no launches since,
   * so `launchApp` may skip its terminate-first step: a terminate right after a cold boot can
   * wedge CoreSimulator until the deadline kills it. Cleared by anything that can start a
   * process (`launchApp`, `openURL`, `sendToHome`) or shut down; restored by a physical boot,
   * guarded by {@link launchSeq} against a launch that landed mid-boot.
   */
  cleanBoot: boolean;
  /** Monotonic launch count; keeps a `boot` completing after a concurrent launch from restoring {@link cleanBoot} over a running process. */
  launchSeq: number;
  /**
   * Per-bundle launch counter — {@link launchSeq} scoped to one app: a rollback that outlives
   * its answer must know whether its process still answers to that bundle id, and the
   * device-wide counter cannot say, since two apps legitimately share a device (spec 003).
   * Counts from the start of a launch, so a relaunch still mid-handshake already claims it.
   */
  launchSeqByBundle: Map<string, number>;
  /**
   * An erase running on this device right now — the one child no caller can kill —
   * settled-never-throwing so waiting on it is always safe. Every other
   * operation on the allocation waits here first rather than racing a still-mutating device.
   * Not deadline-capped: a slow but healthy erase must not be misreported as a wedge.
   */
  erasing?: Promise<void>;
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
  /** Absent when the caller passed `deadlineMs: 0` — no server clock exists. */
  deadline: AbortSignal | undefined;
}

/** The slice of an allocation `_undoAllocation` needs to unwind it. */
interface UndoTarget {
  udid: string;
  allocationId: string;
  created: boolean;
}

export class DetoxServerImpl {
  private _serverPeer: DetoxServerPeer;
  private _devicePool: DevicePool;
  private _simulatorOps: SimulatorOps;
  private _appGateway: AppGateway | undefined;
  private _blobStore: BlobStore | undefined;
  private _config: AppGatewayConfig;
  private _allocations = new Map<string, Allocation>();
  private _released = false;

  constructor({
    serverPeer,
    devicePool,
    simulatorOps,
    appGateway,
    blobStore,
    config = {},
  }: DetoxServerImplDeps) {
    this._serverPeer = serverPeer;
    this._devicePool = devicePool;
    this._simulatorOps = simulatorOps;
    this._appGateway = appGateway;
    this._blobStore = blobStore;
    this._config = config;
    this._registerHandlers();
  }

  /**
   * The socket died. Terminal: hand everything back, and make sure an
   * allocation still in flight cannot re-register itself once it finishes.
   */
  release(): void {
    this._released = true;
    // Identity in the log: "a client went silent" alone is not actionable on a multi-client server.
    if (this._allocations.size > 0) {
      console.log(`[server] connection closed — reclaiming ${this._allocations.size} device(s)`);
    }
    this.releaseAll();
  }

  /**
   * @issue DTX-6002: reclaim honors the same barrier an explicit release does — a tracked
   * operation must settle before the udid moves on. Owner-checked per device.
   * Not terminal, and not exposed as an RPC: it is the body of `release()` alone —
   * conflating "free what I hold" with "we are done" would poison the connection.
   */
  releaseAll(): void {
    for (const allocation of this._allocations.values()) {
      if (allocation.pending.size > 0) {
        void Promise.allSettled([...allocation.pending]).then(() => this._reclaim(allocation));
      } else {
        this._reclaim(allocation);
      }
    }
    this._allocations.clear();
  }

  private _reclaim(allocation: Allocation): void {
    this._closeAppSessions(allocation);
    const outcome = this._devicePool.release(allocation.udid, allocation.allocationId);
    if (outcome) {
      console.log(
        `[server] reclaimed ${allocation.udid} (held ${outcome.heldMs}ms, idle ${outcome.idleMs}ms)`,
      );
    }
  }

  /** Closes every gateway session the allocation launched. Nothing physical — but a socket surviving its owner would let a dead handle's app keep a live channel in. */
  private _closeAppSessions(allocation: Allocation): void {
    for (const session of allocation.apps.values()) {
      if (!session.dead) session.terminateSession();
    }
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
        this._deviceAction(params, () =>
          Promise.reject(
            new DetoxError(`${method} is not implemented yet`, {
              code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED,
              details: { method },
            }),
          ),
        );
    this._serverPeer.onTakeScreenshot(notImplemented('takeScreenshot'));
    this._serverPeer.onReverseTcpPort(notImplemented('reverseTcpPort'));
    this._serverPeer.onUnreverseTcpPort(notImplemented('unreverseTcpPort'));

    // The app gateway (spec 003): install, launch-as-handshake, invoke.
    this._serverPeer.onInstallApp(this._handleInstallApp.bind(this));
    this._serverPeer.onInvoke(this._handleInvoke.bind(this));
    // `reloadReactNative`: one frozen frame on the relay 003 built — the corpus's second-most-called verb.
    this._serverPeer.onReloadReactNative(this._handleReloadReactNative.bind(this));

    // Every app-channel verb spec 003 leaves unwired answers the typed refusal after
    // ownership, like the device verbs above (`waitForActive`/`waitForBackground`/
    // `deliverPayload` left this block with spec 006 — they are live above).
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
    const query = this._buildQuery(params);
    console.log('[server] allocateDevice — query:', JSON.stringify(query));
    narrate({ op: 'allocateDevice', kind: 'progress', message: 'Looking for a matching device' });

    const result = await this._devicePool.allocate({
      query,
      signal: ctx.signal,
      requestedType: params.type,
      // @issue DTX-6011: only `ios.simulator` has a backing pool; any other type is filtered out entirely.
      filter: params.type === 'ios.simulator' ? (d) => d.os?.platform === 'iOS' : () => false,
    });
    console.log('[server] allocateDevice — picked udid:', result.udid);
    narrate({ op: 'allocateDevice', kind: 'progress', message: `Allocated ${result.device.name}` });

    // Allocation always hands back a booted device: a real boot is narrated as
    // a child operation; a warm handoff narrates none (spec 002 test 4).
    let didBoot = false;
    let bootBegan = false;

    // @issue DTX-6007: the rollback is registered now, before any await, and covers the handler
    // throwing, a mid-flight cancellation, and a cancellation arriving after the answer already left.
    ctx.onUndo(() => this._undoAllocation(result, didBoot));

    // Rides this event loop: a genuinely wedged server goes silent too, and the relay's own stall detector catches that.
    const bootHeartbeat = setInterval(() => {
      if (bootBegan) {
        narrate({ op: 'boot', kind: 'progress', message: `Still booting ${result.device.name}` });
      }
    }, BOOT_HEARTBEAT_MS);
    bootHeartbeat.unref();
    try {
      // @issue DTX-6006: false means already up — a warm device we must not shut down on rollback.
      didBoot = await this._simulatorOps.boot({
        udid: result.udid,
        signal: ctx.signal,
        onBootStart: () => {
          bootBegan = true;
          narrate({ op: 'boot', kind: 'begin', message: `Booting ${result.device.name}` });
        },
      });
    } catch (err) {
      if (bootBegan) narrate({ op: 'boot', kind: 'end', ok: false });
      throw err;
    } finally {
      clearInterval(bootHeartbeat);
    }
    if (bootBegan) narrate({ op: 'boot', kind: 'end', ok: true });
    else narrate({ op: 'allocateDevice', kind: 'progress', message: `${result.device.name} was already booted` });
    this._devicePool.noteState(result.udid, 'Booted');
    console.log('[server] allocateDevice — ready:', result.udid, didBoot ? '(booted)' : '(warm)');

    // @issue DTX-6005: refuses to hand over a device nobody will hear about — the ledger takes it back.
    // Kept even though the peer would answer -32800 on its own: `this._released` is not the
    // request's signal, and a successful return would register a watcher on a dead connection.
    if (ctx.signal?.aborted || this._released) {
      throw new AbortError(ctx.signal?.reason);
    }

    const { allocationId } = result;
    this._allocations.set(allocationId, {
      allocationId,
      udid: result.udid,
      created: result.created,
      pending: new Set(),
      apps: new Map(),
      // A warm handoff may carry processes from the previous holder; only a physical boot is launch-free.
      cleanBoot: didBoot,
      launchSeq: 0,
      launchSeqByBundle: new Map(),
    });
    this._devicePool.attachNotifier(allocationId, (state) =>
      this._serverPeer.notifyDeviceStateChanged({ allocationId, state }),
    );
    // @issue DTX-6008: the id stops addressing anything synchronously, before any await, then
    // the reclaim barrier, then the app sessions — LIFO, shaped like `_handleReleaseDevice`.
    ctx.onUndo(async () => {
      const allocation = this._allocations.get(allocationId);
      if (!allocation) return;
      this._allocations.delete(allocationId);
      if (allocation.pending.size > 0) {
        await Promise.allSettled(allocation.pending);
      }
      this._closeAppSessions(allocation);
    });
    return {
      allocationId,
      device: { udid: result.udid },
      name: result.device.name,
      os: this._formatOs(result.device),
      state: 'booted',
    };
  }

  private _handleBootDevice(
    params: BootDeviceRequest,
    ctx: RequestContext,
  ): Promise<BootDeviceResponse> {
    // Through `_deviceAction`: the erase barrier (`simctl boot` racing a
    // still-running `simctl erase` is the accident it exists for).
    return this._deviceAction(params, async (udid, allocation) => {
      const narrate = this._narrator(ctx);
      console.log('[server] bootDevice —', udid);
      narrate({ op: 'boot', kind: 'progress', message: `Booting ${udid}` });
      const launchSeqBefore = allocation.launchSeq;
      const didBoot = await this._simulatorOps.boot({ udid, signal: ctx.signal });
      // Only a physical boot proves launch-free — a launch that landed mid-boot (launchSeq moved) spoils the proof.
      if (didBoot && allocation.launchSeq === launchSeqBefore) allocation.cleanBoot = true;
      narrate({ op: 'boot', kind: 'progress', message: didBoot ? 'Boot finished' : 'Already booted' });
      // Pushed before the response resolves (spec 002's two-writers fix).
      this._devicePool.noteOperationalState(params.allocationId, 'booted');
      return { state: 'booted' };
    });
  }

  private _handleShutdownDevice(
    params: ShutdownDeviceRequest,
    ctx: RequestContext,
  ): Promise<ShutdownDeviceResponse> {
    return this._deviceAction(params, async (udid, allocation) => {
      const narrate = this._narrator(ctx);
      console.log('[server] shutdownDevice —', udid);
      narrate({ op: 'shutdown', kind: 'progress', message: `Shutting down ${udid}` });
      allocation.cleanBoot = false;
      const didShutdown = await this._simulatorOps.shutdown({ udid, signal: ctx.signal });
      narrate({
        op: 'shutdown',
        kind: 'progress',
        message: didShutdown ? 'Shutdown finished' : 'Already shut down',
      });
      this._devicePool.noteOperationalState(params.allocationId, 'shutdown');
      return { state: 'shutdown' };
    });
  }

  private async _handleReleaseDevice(
    params: ReleaseDeviceRequest,
    ctx: RequestContext,
  ): Promise<ReleaseDeviceResponse> {
    const allocation = this._requireAllocation(params.allocationId);
    const narrate = this._narrator(ctx);
    console.log('[server] releaseDevice —', allocation.udid);
    narrate({ op: 'release', kind: 'progress', message: `Releasing ${allocation.udid}` });
    this._allocations.delete(params.allocationId);
    // @issue DTX-6001: the reclaim barrier — a physical operation in flight must settle before the udid moves on.
    if (allocation.pending.size > 0) {
      await Promise.allSettled(allocation.pending);
    }
    // App sessions close after the barrier, not before: a launch completing during the wait
    // registers its session into `allocation.apps`, and a sweep that already ran would leave
    // that socket alive under a dead handle forever.
    this._closeAppSessions(allocation);
    // Instant on the wire; the physical consequences run detached under the server's own signal — pool policy, never client contract.
    const outcome = this._devicePool.release(allocation.udid, params.allocationId);
    if (outcome) {
      console.log(
        `[server] released ${allocation.udid} (held ${outcome.heldMs}ms, idle ${outcome.idleMs}ms)`,
      );
    }
    return { released: true };
  }

  /**
   * The shape every device utility shares: ownership first (the registry is
   * the only address book), then the subprocess work under
   * the reclaim barrier, so a release cannot hand the udid on while a
   * utility is still mutating the device.
   */
  private async _deviceAction<T>(
    params: DeviceActionParams,
    run: (udid: string, allocation: Allocation) => Promise<T>,
  ): Promise<T> {
    // @issue DTX-6012: ownership check and barrier registration happen before the first await.
    const allocation = this._requireAllocation(params.allocationId);
    return this._tracked(
      allocation,
      (async () => {
        if (allocation.erasing) {
          // @issue DTX-6013: re-validated after the erase barrier — a wedged erase may have ended the allocation.
          await allocation.erasing;
          this._requireAllocation(params.allocationId);
        }
        return run(allocation.udid, allocation);
      })(),
    );
  }

  /**
   * @issue DTX-6013: ownership check first, then the erase barrier — a stale handle hears
   * `DETOX_STALE_HANDLE` without waiting for anybody else's erase. Re-validated after the
   * barrier: a wedged erase ends the allocation while we wait, and the waiter
   * answers `DETOX_STALE_HANDLE`, one answer for every dead handle.
   */
  private async _ownedDevice(allocationId: string): Promise<Allocation> {
    const allocation = this._requireAllocation(allocationId);
    if (allocation.erasing) {
      await allocation.erasing;
      return this._requireAllocation(allocationId);
    }
    return allocation;
  }

  /**
   * A parameter the server refuses to guess at. The wire types keep `appId`
   * optional because a Detox-20 caller may omit it (frozen dialect), but
   * "ensure not installed" cannot be honoured without a name — answering
   * success while uninstalling nothing is the silent no-op spec 005 exists
   * to end.
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
    return this._deviceAction(params, (udid) => {
      this._requireParam('uninstallApp', 'appId', params.appId);
      console.log('[server] uninstallApp —', params.appId, 'on', udid);
      return this._simulatorOps.uninstall({
        udid,
        bundleId: params.appId as string,
        signal: ctx.signal,
      });
    });
  }

  private _handleOpenURL(params: OpenURLParams, ctx: RequestContext): Promise<void> {
    return this._deviceAction(params, (udid, allocation) => {
      this._requireParam('openURL', 'url', params.url);
      // @issue DTX-6014: sourceApp is refused, not silently dropped — simctl openurl has no way to honour it.
      if (params.sourceApp !== undefined) {
        throw new DetoxError('openURL cannot honour "sourceApp" on an iOS simulator', {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method: 'openURL', parameter: 'sourceApp' },
        });
      }
      console.log('[server] openURL — on', udid);
      // Opening a URL launches a process (the handling app, or Safari) — the
      // device is no longer known launch-free.
      allocation.cleanBoot = false;
      // The URL is never dereferenced here: it is handed to the simulator, and
      // the server's own filesystem and network position stay out of it.
      return this._simulatorOps.openUrl({ udid, url: params.url, signal: ctx.signal });
    });
  }

  private _handleSetLocation(params: SetLocationParams, ctx: RequestContext): Promise<void> {
    return this._deviceAction(params, (udid) => {
      for (const [name, value] of [['lat', params.lat], ['lon', params.lon]] as const) {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          throw new DetoxError(`setLocation requires a finite "${name}"`, {
            code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
            details: { method: 'setLocation', parameter: name, value },
          });
        }
      }
      console.log('[server] setLocation — on', udid);
      return this._simulatorOps.setLocation({ udid, lat: params.lat, lon: params.lon, signal: ctx.signal });
    });
  }

  private _handleSetStatusBar(params: SetStatusBarParams, ctx: RequestContext): Promise<void> {
    return this._deviceAction(params, (udid) => {
      // @issue DTX-6033: named one by one, not spread-minus-allocationId — a field the two
      // sides disagree about should fail to compile here, not forward to simctl as an unknown flag.
      const overrides: StatusBarOverrides = {
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
      console.log('[server] setStatusBar — on', udid);
      return this._simulatorOps.setStatusBar({ udid, overrides, signal: ctx.signal });
    });
  }

  private _handleResetStatusBar(params: ResetStatusBarParams, ctx: RequestContext): Promise<void> {
    return this._deviceAction(params, (udid) => {
      console.log('[server] resetStatusBar — on', udid);
      return this._simulatorOps.resetStatusBar({ udid, signal: ctx.signal });
    });
  }

  private _handleSetBiometricEnrollment(
    params: SetBiometricEnrollmentParams,
    ctx: RequestContext,
  ): Promise<void> {
    return this._deviceAction(params, (udid) => {
      if (typeof params.enabled !== 'boolean') {
        throw new DetoxError('setBiometricEnrollment requires a boolean "enabled"', {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method: 'setBiometricEnrollment', parameter: 'enabled' },
        });
      }
      console.log('[server] setBiometricEnrollment —', params.enabled, 'on', udid);
      return this._simulatorOps.setBiometricEnrollment({ udid, enabled: params.enabled, signal: ctx.signal });
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
    return this._deviceAction(params, (udid) => {
      console.log(`[server] ${matched ? '' : 'un'}match ${kind} — on`, udid);
      return this._simulatorOps.matchBiometric({ udid, kind, matched, signal: ctx.signal });
    });
  }

  private _handleClearKeychain(params: ClearKeychainParams, ctx: RequestContext): Promise<void> {
    return this._deviceAction(params, (udid) => {
      console.log('[server] clearKeychain — on', udid);
      return this._simulatorOps.clearKeychain({ udid, signal: ctx.signal });
    });
  }

  /**
   * The full wipe, v20-shaped: shutdown → erase → boot, all
   * server-side, resolving to a live device — `simctl erase` refuses a booted device.
   * @issue DTX-6017: the erase child is never killed by the caller's abort; the abort is
   * honoured only after it settles, and a cancelled wipe never boots. The boot is narrated
   * only when one actually runs, and the state transitions are pushed before the response resolves.
   */
  private _handleResetContentAndSettings(
    params: ResetContentAndSettingsParams,
    ctx: RequestContext,
  ): Promise<void> {
    return this._deviceAction(params, (udid, allocation) => this._wipe(allocation, udid, ctx));
  }

  private async _wipe(allocation: Allocation, udid: string, ctx: RequestContext): Promise<void> {
    const { allocationId } = allocation;
    const { signal } = ctx;
    const narrate = this._narrator(ctx);
    console.log('[server] resetContentAndSettings —', udid);
    this._throwIfAborted(signal);

    narrate({ op: 'resetContentAndSettings', kind: 'progress', message: `Shutting down ${udid}` });
    let didShutdown: boolean;
    try {
      // @issue DTX-6019: no caller signal — a killed shutdown leaves the device in
      // "Shutting Down" with nothing to compensate it; the abort waits until between steps.
      didShutdown = await this._simulatorOps.shutdown({ udid });
    } catch (err) {
      throw this._noteUnknownState(
        allocation,
        udid,
        unknownStateIfKilled(err, {
          udid,
          command: 'simctl shutdown',
          timeoutMs: TEARDOWN_TIMEOUT_MS,
        }),
      );
    }
    // Like `_handleShutdownDevice`: a device already cold was not "shut
    // down" by us, and the narration says so.
    if (!didShutdown) {
      narrate({ op: 'resetContentAndSettings', kind: 'progress', message: `${udid} was already shut down` });
    }
    this._devicePool.noteOperationalState(allocationId, 'shutdown');

    this._throwIfAborted(signal);
    narrate({ op: 'resetContentAndSettings', kind: 'progress', message: `Erasing ${udid}` });
    // The barrier every other operation on this allocation waits on. The
    // wedge bookkeeping runs inside it, before it settles, so a waiter that
    // wakes up always sees the world the erase left behind.
    const erasing = (async () => {
      try {
        // @issue DTX-6017: no signal — this child runs to completion or to the server's own deadline.
        await this._simulatorOps.erase({ udid });
      } catch (err) {
        throw this._noteUnknownState(allocation, udid, err);
      }
    })();
    // Settled-never-throwing, so a waiter can `await` it without inheriting
    // this call's failure (and without an unhandled rejection of its own).
    allocation.erasing = erasing.then(
      () => undefined,
      () => undefined,
    );
    try {
      await erasing;
    } finally {
      allocation.erasing = undefined;
    }

    // @issue DTX-6017: the erase is over; now the abort is honoured — a cancelled wipe never boots.
    if (signal?.aborted) {
      console.log('[server] resetContentAndSettings — cancelled after erase; leaving', udid, 'cold');
      throw new AbortError(signal.reason);
    }

    let bootBegan = false;
    try {
      await this._simulatorOps.boot({
        udid,
        signal,
        onBootStart: () => {
          bootBegan = true;
          narrate({ op: 'boot', kind: 'begin', message: `Booting ${udid}` });
        },
      });
    } catch (err) {
      if (bootBegan) narrate({ op: 'boot', kind: 'end', ok: false });
      throw err;
    }
    if (bootBegan) narrate({ op: 'boot', kind: 'end', ok: true });
    // A post-erase boot is the cleanest boot there is: the disk was wiped and
    // we performed the boot ourselves. No launchSeq guard needed — device
    // actions wait out the erase barrier, and this leg runs before return.
    allocation.cleanBoot = true;
    // Pushed before the response resolves: `device.state` must already read
    // `booted` when the caller's `await` returns (spec 002's two-writers fix).
    this._devicePool.noteOperationalState(allocationId, 'booted');
  }

  /**
   * @issue DTX-6020: whichever leg of the wipe our own deadline killed leaves the device
   * unknown-state — the allocation ends here, and the udid is fenced off from every later pick until restart.
   * Nothing physical is attempted; we do not know what the device is. Any
   * other failure passes straight through, unchanged. Returns the error
   * rather than throwing it so each call site reads as the `throw` it is.
   */
  private _noteUnknownState(allocation: Allocation, udid: string, err: unknown): Error {
    if (err instanceof DetoxError && err.code === DetoxErrorCode.DETOX_DEVICE_UNKNOWN_STATE) {
      const { allocationId } = allocation;
      this._allocations.delete(allocationId);
      this._devicePool.markUnknown(udid, allocationId, err.message);
    }
    return err instanceof Error ? err : new Error(String(err));
  }

  /** @issue DTX-6018: the server's own abort rejection — never the caller's raw reason object. */
  private _throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) throw new AbortError(signal.reason);
  }

  /**
   * @issue DTX-6032: `installApp` speaks exactly two wire forms (spec 007) — an http(s) URL
   * (`appPath`) XOR a blob address (`blob`). A bare filesystem path is a
   * version skew, answered instructively, never by reading this machine's disk.
   */
  private _handleInstallApp(params: InstallAppParams, ctx: RequestContext): Promise<void> {
    return this._deviceAction(params, async (udid) => {
      // `?? undefined` folds null into undefined: a hostile or sloppy peer's `blob: null`
      // must read as "absent" and answer the typed 2011 below, never die on `null.algo`.
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
        return this._installByBlob(udid, blob, ctx);
      }

      // Logged as origin+path only: presigned and `user:pass@` URLs must not reach the log.
      // Not loopback-gated: a URL only spends the server's network position (see app-archive.ts).
      if (isHttpUrl(appPath as string)) {
        const url = appPath as string;
        const narrate = this._narrator(ctx);
        console.log('[server] installApp (url) —', redactUrlForLog(url), 'on', udid);
        narrate({ op: 'installApp', kind: 'progress', message: `Fetching ${redactUrlForLog(url)}` });
        const fetched = await fetchAndUnpackApp(url, { signal: ctx.signal });
        try {
          narrate({ op: 'installApp', kind: 'progress', message: `Installing on ${udid}` });
          await this._simulatorOps.install({ udid, appPath: fetched.appPath, signal: ctx.signal });
        } finally {
          await fetched.dispose();
        }
        return;
      }

      // A string that is not a URL used to mean "read my disk"; that meaning died with the
      // lane, so receiving one means the client predates this server.
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
   * unpack it to a fresh temp dir (never installed from directly), `simctl install`, dispose
   * the temp tree in all endings. A blob the store does not hold answers
   * `DETOX_APP_TRANSFER_FAILED` — the client's cue for its one transparent re-upload round.
   */
  private async _installByBlob(
    udid: string,
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
    // Pin-or-absent is one atomic step: a pin after an existence check would
    // leave a window for the eviction the pin exists to fence.
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
      store.touch(blob.hex); // an install start is a use, for the store's LRU order
      const narrate = this._narrator(ctx);
      console.log('[server] installApp (blob) —', shown, 'on', udid);
      narrate({ op: 'installApp', kind: 'progress', message: `Unpacking ${shown}` });
      const unpacked = await unpackAppArchive(store.pathOf(blob.hex), {
        signal: ctx.signal,
        shown,
      });
      try {
        narrate({ op: 'installApp', kind: 'progress', message: `Installing on ${udid}` });
        await this._simulatorOps.install({ udid, appPath: unpacked.appPath, signal: ctx.signal });
      } finally {
        await unpacked.dispose();
      }
    } finally {
      store.unpin(blob.hex);
    }
  }

  /**
   * `launchApp` is a handshake, not a fire-and-forget (spec 003): terminate any live instance
   * first, spawn with the frozen argv convention, then resolve only after the app logged in
   * and said `ready`. Terminate-first is justified by the handshake, not by any hang: `simctl
   * launch` over a live instance simply resumes it (same pid, no new argv, no new login),
   * not the fresh process + full handshake this verb promises.
   * Since spec 006 the verb also carries launch args, language/locale, at-launch payloads as
   * values the server materializes, and a caller-owned `deadlineMs`, all validated
   * before any side effect.
   */
  private async _handleLaunchApp(
    params: LaunchAppParams,
    ctx: RequestContext,
  ): Promise<LaunchAppResult> {
    return this._deviceAction(params, async (udid, allocation) => {
      this._requireParam('launchApp', 'appId', params.appId);
      const bundleId = params.appId as string;
      const gateway = this._appGateway;
      if (!gateway) {
        throw new DetoxError('launchApp requires the app gateway, which this server did not start', {
          code: DetoxErrorCode.DETOX_NOT_IMPLEMENTED,
          details: { method: 'launchApp' },
        });
      }
      // Validation precedes every side effect (spec 006, binding): a bad
      // option can never cost the caller their running app.
      this._validateLaunchParams(params);
      // @issue DTX-6022: the framework resolves under the same before-any-side-effect rule.
      // Re-resolved per launch: building the v20 cache mid-session works without a server restart.
      const frameworkPath = await this._simulatorOps.resolveFrameworkPath(
        this._config.iosFrameworkPath,
      );
      const notificationJson =
        params.userNotification !== undefined
          ? serializePayloadValue('userNotification', params.userNotification)
          : undefined;
      const activityJson =
        params.userActivity !== undefined
          ? serializePayloadValue('userActivity', params.userActivity)
          : undefined;
      console.log('[server] launchApp —', bundleId, 'on', udid);

      // @issue DTX-6023: `0` is a branch, not a value — it means no server deadline, not an immediate one.
      const deadline =
        params.deadlineMs === 0
          ? undefined
          : AbortSignal.timeout(
              params.deadlineMs ?? this._config.launchReadyTimeoutMs ?? LAUNCH_READY_TIMEOUT_MS,
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

      // Terminate-first is skipped on a device the server itself cold-booted
      // with no launches since (see `Allocation.cleanBoot`): nothing can be
      // running, and the terminate itself is the hazard there.
      if (!allocation.cleanBoot) {
        try {
          await this._simulatorOps.terminate({ udid, bundleId, signal: handshakeSignal });
        } catch (err) {
          throw this._launchFailure({ err, bundleId, callerSignal: ctx.signal, deadline });
        }
      }
      // A process may have been spawned from here on — the device is no
      // longer known launch-free, and concurrent boots must not restore the
      // flag over it (launchSeq guards their set).
      allocation.cleanBoot = false;
      allocation.launchSeq += 1;
      // Claimed from the start of the launch, before the spawn: a relaunch
      // still mid-handshake already owns the bundle id (see `launchSeqByBundle`).
      const ourBundleSeq = (allocation.launchSeqByBundle.get(bundleId) ?? 0) + 1;
      allocation.launchSeqByBundle.set(bundleId, ourBundleSeq);

      // The claim is registered before the spawn: whichever of "simctl
      // returned" and "the app dialed in" happens first, the login has a home.
      const pending = gateway.expectApp({ udid, sessionId: bundleId });
      let pid = 0;
      let session: AppSession | undefined;
      // Published only on the way out, so at unwind time it is set exactly
      // when the client was handed an address for this app.
      const published: { appHandleId?: string } = {};
      // Registered rather than called by hand: the peer keeps the ledger for a minute after
      // the answer, and a late cancellation finds the client already discarded the response —
      // `appHandleId` with it. Read at unwind time: what to take back depends on handshake progress.
      ctx.onUndo(async () => {
        pending.cancel();
        session?.terminateSession();
        if (published.appHandleId) allocation.apps.delete(published.appHandleId);
        if (pid <= 0) {
          // Never got a pid, so never owned a process — holding the bundle's claim would
          // silence the rollback of a concurrent launch that spawned while ours was failing.
          if (allocation.launchSeqByBundle.get(bundleId) === ourBundleSeq) {
            allocation.launchSeqByBundle.set(bundleId, ourBundleSeq - 1);
          }
          return;
        }
        // Ownership before the physical half: `simctl terminate` obeys whatever udid it is
        // given, and by now the device may be another connection's. Asking and
        // acting must be one step — the fence holds the device out of picks and eviction until done.
        const unfence = this._devicePool.fenceForCleanup(udid, allocation.allocationId);
        if (!unfence) {
          console.log('[server] launchApp — rollback skipped, device moved on:', bundleId);
          return;
        }
        try {
          // A later launch of this bundle may own the process now (relaunch
          // supersedes); see `launchSeqByBundle`.
          if (allocation.launchSeqByBundle.get(bundleId) !== ourBundleSeq) {
            console.log('[server] launchApp — rollback skipped, superseded:', bundleId);
            return;
          }
          // The erase barrier binds compensations too: a rollback landing
          // inside the retention window can meet a wipe the same client
          // started afterwards.
          if (allocation.erasing) await allocation.erasing;
          // Awaited, not detached: the caller must hear undo-failed, not a clean undone about a still-running app.
          await this._tracked(
            allocation,
            this._simulatorOps.terminate({ udid, bundleId, tolerateDownDevice: true }),
          );
        } finally {
          unfence();
        }
      });
      try {
        pid = await this._simulatorOps.launch({
          udid,
          bundleId,
          launchArgs: params.launchArgs,
          languageAndLocale: params.languageAndLocale,
          payloadArgs,
          detox: {
            // Per-launch claim URL: gateway address plus this launch's own nonce, the device
            // half of the (device, session id) identity — the login frame carries only the session id.
            serverUrl: pending.url,
            // The session id is the bundle id, the frozen native's own default.
            sessionId: bundleId,
            frameworkPath,
          },
          signal: handshakeSignal,
        });
        session = await abortable(pending.session, handshakeSignal);
        session.pid = pid;
        await abortable(session.ready, handshakeSignal);
      } catch (err) {
        throw this._launchFailure({ err, bundleId, callerSignal: ctx.signal, deadline });
      }

      // @issue DTX-6005: a cancellation (or the socket dying) landing during the handshake must
      // not hand over an app nobody will hear about — the ledger takes the launch back.
      if (ctx.signal?.aborted || this._released) {
        throw new AbortError(ctx.signal?.reason);
      }

      const appHandleId = randomUUID();
      allocation.apps.set(appHandleId, session);
      published.appHandleId = appHandleId;
      // @issue DTX-6021: from here the payload files' lifetime is the handle's, not the ledger's.
      for (const payload of payloads) {
        session.onDeath(() => disposeQuietly(payload));
      }
      console.log('[server] launchApp — ready:', bundleId, 'pid', pid);
      return { pid, appHandleId };
    });
  }

  /**
   * Classifies the failure: the caller's abort stays the uniform typed
   * abort; the deadline expiring is the app's failure to complete the
   * handshake — `DETOX_APP_DIED`, because "never became ready" and "died
   * before ready" are indistinguishable from where the server stands.
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
   * Every launch-option refusal, in one place, before any side effect (spec
   * 006, binding): a 2011 here must leave a running instance untouched — no
   * terminate-first, no payload file, no spawn.
   */
  private _validateLaunchParams(params: LaunchAppParams): void {
    // Through `unknown`: the wire object may carry keys the type no longer declares.
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
      // A key rendered `-${key}` that itself starts with `-` composes a --flag token — the
      // same flag-shaped-argv hazard `refuseFlagShaped` guards elsewhere. Values stay free:
      // `{ delay: -5 }` is a legitimate arg.
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
    if (raw.deadlineMs !== undefined) {
      const deadlineMs = raw.deadlineMs;
      // @issue DTX-6025: integer and <= 2^31-1, matching what the clock can actually honour.
      if (
        typeof deadlineMs !== 'number' ||
        !Number.isInteger(deadlineMs) ||
        deadlineMs < 0 ||
        deadlineMs > 2 ** 31 - 1
      ) {
        throw new DetoxError(
          `launchApp deadlineMs must be a whole number of milliseconds between 0 (no server deadline) and ${String(2 ** 31 - 1)} — got ${JSON.stringify(deadlineMs)}`,
          {
            code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
            details: { method: 'launchApp', parameter: 'deadlineMs' },
          },
        );
      }
    }
  }

  /**
   * @issue DTX-6026: the payload trio's shared rules (spec 006), used by both the at-launch
   * options and live delivery — mutual exclusivity is presence-based, not truthiness-based,
   * so an empty url is its own refusal, and `sourceApp` only means anything next to `url`.
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
    // @issue DTX-6027: the frozen native fatalErrors on whitespace in a url; a typed refusal here
    // beats an app crash blamed on 2013. No full URL parse: Node's parser is stricter than
    // Foundation's, and over-refusing would break payloads the native accepts.
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
    // @issue DTX-6027: shape, not just presence — the native reads the materialized file
    // expecting a dictionary, so a string or array would crash the app the gateway protects.
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
   * `device.setPermissions` (spec 006): its own verb, never a launch option — the
   * applesimutils-backed services restart SpringBoard, a device-wide blast radius. Uniform
   * check order (ownership first). No rollback is registered — permissions are state, not a resource.
   */
  private _handleSetPermissions(params: SetPermissionsParams, ctx: RequestContext): Promise<void> {
    return this._deviceAction(params, (udid) => {
      this._requireParam('setPermissions', 'appId', params.appId);
      this._requireParam('setPermissions', 'permissions', params.permissions);
      const permissions = params.permissions as Record<string, string>;
      if (typeof permissions !== 'object' || Array.isArray(permissions)) {
        throw new DetoxError('setPermissions requires an object "permissions" map', {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method: 'setPermissions', parameter: 'permissions' },
        });
      }
      // An empty map would answer success having set nothing — the same
      // silent no-op class spec 005's `_requireParam` exists to end.
      if (Object.keys(permissions).length === 0) {
        throw new DetoxError('setPermissions requires at least one service in "permissions"', {
          code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
          details: { method: 'setPermissions', parameter: 'permissions' },
        });
      }
      console.log('[server] setPermissions —', params.appId, 'on', udid);
      return this._simulatorOps.setPermissions({
        udid,
        bundleId: params.appId as string,
        permissions,
        signal: ctx.signal,
      });
    });
  }

  /**
   * @issue DTX-6028: `app.foreground()` is a resume, never a launch — `simctl launch` over the
   * live process keeps the pid and performs no new launch transaction. Resolves
   * on the app's own `waitForActiveDone`. Check order: device ownership, then
   * handle liveness (see `_liveAppSession`). The resume child is tracked; the state wait is
   * wire traffic and deliberately is not, since an app that never answers must not hold
   * `release` hostage. A foreground racing an app crash can leave a stray uninstrumented
   * relaunch on screen; the verdict is still 2013 when the session dies.
   */
  private async _handleForegroundApp(params: ForegroundAppParams, ctx: RequestContext): Promise<void> {
    const allocation = await this._ownedDevice(params.allocationId);
    const session = this._liveAppSession(allocation, params.appHandleId);
    console.log('[server] foregroundApp —', session.sessionId, 'on', allocation.udid);
    // `simctl launch` can start a process (the crash race above) — the device
    // is no longer known launch-free.
    allocation.cleanBoot = false;
    await this._tracked(
      allocation,
      this._simulatorOps.resume({
        udid: allocation.udid,
        bundleId: session.sessionId,
        signal: ctx.signal,
      }),
    );
    await session.waitForActive({ signal: ctx.signal });
  }

  /**
   * The app-state waits (spec 006): relay the frozen frame, settle only on the app's own
   * word. Signal-only — no deadline parameter (extending `deadlineMs` to these waits
   * would be a deliberate API change, not a default). Untracked wire traffic, like invoke.
   */
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
   * Live payload delivery (spec 006): the payload arrives as a value, the server materializes
   * it to its own file, and the frozen `deliverPayload` frame carries that server-local path
   * (plus `delayPayload` to park delivery until the next activation). Resolves on the app's
   * own `deliverPayloadDone`. Untracked wire traffic, like invoke.
   * @issue DTX-6021: the materialized file inherits the handle's lifetime, like an at-launch payload.
   */
  private async _handleDeliverPayload(params: DeliverPayloadParams, ctx: RequestContext): Promise<void> {
    const allocation = await this._ownedDevice(params.allocationId);
    const session = this._liveAppSession(allocation, params.appHandleId);
    // Through `unknown`: the dead path keys are exactly the keys the type no longer declares.
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
      // Registered before the frame goes out: if the session is already dead
      // (or dies mid-send), the debt is due immediately and the file goes
      // with it.
      const owed = payload;
      session.onDeath(() => disposeQuietly(owed));
      frame[kind === 'userNotification' ? 'detoxUserNotificationDataURL' : 'detoxUserActivityDataURL'] =
        payload.path;
    }
    if (params.delayPayload === true) frame.delayPayload = true;
    console.log('[server] deliverPayload —', session.sessionId, 'on', allocation.udid);
    await session.deliverPayload(frame, { signal: ctx.signal });
    // @issue DTX-6030: an immediate delivery's file is freed now, not at handle death — a
    // delivery loop must not turn the server's tmpdir into a disk lever. Delayed and aborted
    // deliveries keep the handle-lifetime rule; dispose is memoized, so meeting it twice is a no-op.
    if (payload && params.delayPayload !== true) disposeQuietly(payload);
  }

  /**
   * Sync settings (parity): v20's `device.enableSynchronization` / `disableSynchronization` /
   * `setURLBlacklist` all ride one frozen frame, `setSyncSettings` with `{enabled}` or
   * `{blacklistURLs}`, answered by the app's `setSyncSettingsDone`. Validated before any side
   * effect, like every launch option (spec 006).
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
    console.log('[server] setSyncSettings —', session.sessionId, 'on', allocation.udid);
    await session.setSyncSettings(frame, { signal: ctx.signal });
  }

  /**
   * The element channel (spec 003): relays the frozen-dialect invocation to the app session
   * and correlates the reply. Not `_tracked`: wire traffic, not a device mutation — an app
   * that never answers must not hold `release` hostage. Check order, uniform with every
   * device action: device ownership, then app-handle liveness.
   */
  private async _handleInvoke(params: InvokeParams, ctx: RequestContext): Promise<InvokeResult> {
    const allocation = await this._ownedDevice(params.allocationId);
    this._requireParam('invoke', 'invocation', params.invocation);
    // Shape, not just presence: the frozen native force-unwraps a dictionary
    // from the invocation, so a string or array would crash the app.
    if (typeof params.invocation !== 'object' || Array.isArray(params.invocation)) {
      throw new DetoxError('invoke requires an object "invocation"', {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { method: 'invoke', parameter: 'invocation' },
      });
    }
    const session = this._liveAppSession(allocation, params.appHandleId);
    return session.invoke(params.invocation, { signal: ctx.signal });
  }

  /**
   * `reloadReactNative` (the parity corpus's second-most-called verb): one
   * frozen `reactNativeReload` frame, resolved by the app's next `ready`.
   * Not `_tracked`, for the same reason as `_handleInvoke`: an app that
   * never comes back ready must not hold `release` hostage.
   */
  private async _handleReloadReactNative(
    params: ReloadReactNativeParams,
    ctx: RequestContext,
  ): Promise<void> {
    const allocation = await this._ownedDevice(params.allocationId);
    const session = this._liveAppSession(allocation, params.appHandleId);
    console.log('[server] reloadReactNative —', session.sessionId, 'on', allocation.udid);
    await session.reloadReactNative({ signal: ctx.signal });
  }

  /**
   * `terminate` through an app handle kills the OS process, closes that gateway session, and
   * invalidates exactly that handle (spec 003). The legacy Detox-20 path (bundle id, no
   * handle) keeps its old shape, plus: sessions launched for that bundle are closed too.
   */
  private async _handleTerminateApp(
    params: TerminateAppParams,
    ctx: RequestContext,
  ): Promise<void> {
    await this._deviceAction(params, async (udid, allocation) => {
      if (params.appHandleId !== undefined) {
        const session = this._liveAppSession(allocation, params.appHandleId);
        console.log('[server] terminateApp —', session.sessionId, 'on', udid);
        await this._simulatorOps.terminate({ udid, bundleId: session.sessionId, signal: ctx.signal });
        // The process's own socket death and this active close may race —
        // "closed" is the pin, never who closed first (spec 003).
        session.terminateSession();
        return;
      }
      this._requireParam('terminateApp', 'appId', params.appId);
      const bundleId = params.appId as string;
      console.log('[server] terminateApp —', bundleId, 'on', udid);
      await this._simulatorOps.terminate({ udid, bundleId, signal: ctx.signal });
      for (const session of allocation.apps.values()) {
        if (session.sessionId === bundleId && !session.dead) session.terminateSession();
      }
    });
  }

  /**
   * @issue DTX-6029: app-handle liveness, after ownership — a handle this allocation never
   * minted and one whose session died get the same DETOX_APP_DIED (the stale-handle
   * uniformity of the device layer, one level up).
   */
  private _liveAppSession(allocation: Allocation, appHandleId: string): AppSession {
    this._requireParam('appAction', 'appHandleId', appHandleId);
    const session = allocation.apps.get(appHandleId);
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
    // @issue DTX-6031: through `_deviceAction` like every sibling, including the erase barrier.
    await this._deviceAction(params, (udid, allocation) => {
      console.log('[server] sendToHome — on', udid);
      // The SpringBoard proxy launches Settings — the device is no longer known launch-free.
      allocation.cleanBoot = false;
      return this._simulatorOps.sendToHome({ udid, signal: ctx.signal });
    });
  }

  /**
   * Rolls back an allocation nobody will ever hear about. @issue DTX-6006: a created
   * simulator is always deleted; one merely booted is shut down; a warm one
   * from the pool is left exactly as it was. Runs without the request's signal (we are here
   * because it aborted); the pool claim is released only after the physical cleanup (spec 002).
   */
  private async _undoAllocation(result: UndoTarget, weBootedIt: boolean): Promise<void> {
    const { udid, allocationId, created } = result;
    // @issue DTX-6009: ownership is re-checked first — the udid may have moved on to another owner.
    if (!this._devicePool.isHeldBy(udid, allocationId)) {
      console.log('[server] allocateDevice — rollback skipped, device moved on:', udid);
      return;
    }
    console.log('[server] allocateDevice — rolling back:', udid, created ? '(created)' : '');
    let shutdownFailure: Error | undefined;
    if (weBootedIt || created) {
      try {
        await this._simulatorOps.shutdown({ udid });
        this._devicePool.noteState(udid, 'Shutdown');
      } catch (err) {
        // @issue DTX-6010: rethrown at the end, so the caller hears undo-failed, not a clean undone.
        shutdownFailure = err instanceof Error ? err : new Error(String(err));
        console.error('[server] compensating shutdown failed for', udid, err);
      }
    }
    if (created) {
      // Retrying and detached, via the pool: CoreSimulator may refuse the
      // delete while still materializing the device, and a single attempt
      // would leak the very simulator that nothing else is allowed to GC.
      this._devicePool.discardCreated(udid, allocationId);
    } else {
      this._devicePool.release(udid, allocationId);
    }
    if (shutdownFailure) throw shutdownFailure;
  }

  private _requireAllocation(allocationId: string): Allocation {
    const allocation = this._allocations.get(allocationId);
    if (!allocation) {
      throw new DetoxError(`Unknown allocation: ${allocationId}`, {
        code: DetoxErrorCode.DETOX_STALE_HANDLE,
        details: { allocationId },
      });
    }
    this._devicePool.touch(allocationId);
    return allocation;
  }

  private _narrator(ctx: RequestContext): (value: OperationProgress) => void {
    return (value) => ctx.progress?.(value);
  }

  private _formatOs(device: DeviceInfo): string {
    // applesimutils' os.name already reads `iOS 26.5` — version included.
    return device.os?.name ?? 'iOS';
  }

  private _buildQuery({ type, device }: AllocateDeviceRequest): Record<string, string> {
    if (type === 'ios.simulator') {
      const d = device as { id?: string; name?: string; type?: string; os?: string } | undefined;
      const query: Record<string, string> = {};
      if (d?.id) query.byId = d.id;
      if (d?.name) query.byName = d.name;
      if (d?.type) query.byType = d.type;
      if (d?.os) query.byOS = d.os;
      return query;
    }
    return {};
  }
}

/**
 * Awaits `promise` unless `signal` fires first. The underlying promise is not
 * cancelled — the caller owns its cleanup; this only stops the wait. An
 * absent signal is a plain await: `deadlineMs: 0` with no caller signal
 * legally waits forever (spec 006 — the caller owns that choice).
 */
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
