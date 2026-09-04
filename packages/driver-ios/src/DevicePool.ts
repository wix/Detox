import type { DeviceRuntimeState } from '@detox-remote/protocol';
import type { DeviceInfo } from './SimulatorOps';
import { DevicePoolExhaustedError, NoMatchingDeviceError } from '@detox-remote/core';
import type { DriverLog } from '@detox-remote/server';

const describeError = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/** A bare optional signal — the listing-adjacent reads (`rawDevices`). */
export interface PoolSignalArgs {
  signal?: AbortSignal;
}

/** The `{udid, signal}` pair every single-device pool verb takes. */
export interface PoolDeviceArgs extends PoolSignalArgs {
  udid: string;
}

export interface PoolListArgs {
  /** The iOS driver's own listing vocabulary (applesimutils' `--byId/--byType/--byOS`). */
  query: Record<string, string>;
  signal?: AbortSignal;
}

/** What `creatable` answers when an unmatched query could be satisfied by creating a simulator (spec 002). */
export interface CreatableDevice {
  /** The human name the created device gets — and what `byType` queries find later. */
  model: string;
  deviceTypeIdentifier: string;
  runtime: { identifier: string; name: string; version: string };
}

export interface PoolCreateArgs {
  name: string;
  deviceTypeIdentifier: string;
  runtimeIdentifier: string;
  signal?: AbortSignal;
}

/** One device as `simctl` itself lists it — including half-made ones `list` may hide (the rollback's view). */
export interface RawPoolDevice {
  udid: string;
  name: string;
  state: string;
}

/**
 * What the pool needs of the iOS driver: list simulators, shut one down, and
 * — optionally — create one on a miss (spec 002's creatable queries). The
 * pool is the built-in driver's own machinery (spec 015: a platform's pooling
 * is the driver's), so this vocabulary is `simctl`'s and stays inside it.
 */
export interface PoolDriver {
  list(args: PoolListArgs): Promise<DeviceInfo[]>;
  shutdown(args: PoolDeviceArgs): Promise<boolean>;
  /** Whether an unmatched query could be answered by creating a device. Absent → never. */
  creatable?(args: PoolListArgs): Promise<CreatableDevice | undefined>;
  create?(args: PoolCreateArgs): Promise<string>;
  deleteDevice?(args: PoolDeviceArgs): Promise<void>;
  rawDevices?(args?: PoolSignalArgs): Promise<RawPoolDevice[]>;
  /** The reconcile loop's fresh sample shows the device down or gone: its per-device object (the gateway) has nothing left to serve. */
  deviceWentDown?(udid: string): Promise<void>;
}

export interface DevicePoolDeps {
  driver: PoolDriver;
  maxPool: number;
  /** The server's log, off the toolkit. */
  log: DriverLog;
}

export interface AllocateArgs {
  /** The core's allocation id — the holder is recorded under it (spec 004 names holders by it). */
  allocationId: string;
  query: Record<string, string>;
  signal?: AbortSignal;
  /**
   * An extra narrowing over the driver's listing, beyond what the query flags
   * express. The driver already narrows to its platform (spec 015); this is a
   * generic pool convenience (and the seam the unit tests select a device by).
   */
  filter?: (device: DeviceInfo) => boolean;
  /** The public device type the query came from — error payloads only. */
  requestedType?: string;
}

export interface AllocateResult {
  allocationId: string;
  udid: string;
  device: DeviceInfo;
  /** This allocation created the simulator; its rollback must delete it (spec 002). */
  created: boolean;
}

/**
 * A device this server life has handed out — the exhaustion error's
 * "holder", and the ownership record.
 * @issue DTX-6218: a release or rollback presenting a stale allocation id
 * is a silent no-op, never a theft.
 */
interface Holder {
  allocationId: string;
  udid: string;
  startedAt: number;
  /** Pushes `deviceStateChanged` to the owning connection; attached once the allocation completes. */
  notify?: (state: DeviceRuntimeState) => void;
  /** Last state the client was told (push or response) — reconcile only speaks on change. */
  lastNotified: DeviceRuntimeState | null;
  /**
   * When a request-driven transition last set the state. A reconcile tick
   * whose listing started earlier than this must not act on its sample: the
   * sample predates the transition and would regress the client's fresher
   * value (the two-writers problem, spec 002).
   */
  noteAt: number;
}

interface ListingMemo {
  devices: DeviceInfo[];
  at: number;
}

/** A known raw simctl state and when it was learned — freshest writer wins. */
interface StateNote {
  state: string;
  at: number;
}

/** How often the reconcile loop re-asks the ground truth (a default, not a contract). */
const RECONCILE_INTERVAL_MS = 750;
/**
 * How long a listing answers repeat queries without a new subprocess. The
 * reconcile loop refreshes the generic listing every tick while the pool has
 * anything to watch, so in steady state a refusal almost always hits the
 * memo; a cold memo (idle server, slow listing) makes the first refusal pay
 * for one listing.
 * @issue DTX-6219: fail-fast makes retry loops the norm, so
 * the refusal path must stay off the subprocess.
 */
const LISTING_MEMO_TTL_MS = 1000;
const LISTING_MEMO_MAX_ENTRIES = 32;
/** How long a creatable-device-type answer (from `simctl list runtimes`) stays fresh. */
const CREATABLE_MEMO_TTL_MS = 10_000;
/** A cancelled create's leftover may refuse deletion while CoreSimulator finishes materializing it. */
const ROLLBACK_ATTEMPTS = 30;
const ROLLBACK_RETRY_MS = 1000;
/** Refusals are counted always but logged sampled — retry loops are the norm. */
const REFUSAL_LOG_EVERY = 100;
const REFUSAL_LOG_FIRST = 10;

export function toRuntimeState(simctlState: string): DeviceRuntimeState {
  switch (simctlState) {
    case 'Booted':
      return 'booted';
    case 'Booting':
      return 'booting';
    case 'Shutting Down':
      return 'shutting-down';
    default:
      return 'shutdown';
  }
}

function memoKey(query: Record<string, string>): string {
  return JSON.stringify(Object.entries(query).sort());
}

/**
 * The device registry (spec 002): owns the fleet the way a real pool does.
 * Ownership records instead of a busy-set, warm released devices that count
 * toward the cap and are evicted LRU, a single reconcile loop
 * instead of per-allocation pollers (so the pollers cannot race each other),
 * in-memory rollback of cancelled creations (no persistent state at all),
 * and typed, counted refusals.
 */
export class DevicePool {
  private _busy = new Map<string, Holder>();
  private _byAllocation = new Map<string, string>();
  /** Released-but-still-booted devices this life handed out: udid → release time (LRU key). */
  private _warm = new Map<string, number>();
  /**
   * Devices whose physical undoing (eviction shutdown, rollback delete) is
   * still in flight: free, but no allocation may pick one until it settles.
   */
  private _evicting = new Set<string>();
  /**
   * Devices whose state is unknown because the server's own deadline had to
   * kill an operation on them. Excluded from picks for the rest
   * of this server's life — never re-warmed, never probed, nothing written
   * to disk, so a restart clears it. Automatic recovery is not implemented;
   * its home would be the reconcile loop, not here.
   */
  private _unknown = new Set<string>();
  /**
   * Devices a compensation is physically cleaning up right now — see
   * {@link fenceForCleanup}. Unlike {@link _evicting} the device may still be
   * held (by the very allocation doing the cleanup); the fence only guarantees
   * that nobody new gets it, and that eviction will not shut it down under a
   * command already running against it.
   */
  private _cleaning = new Set<string>();
  /** Freshest known raw simctl state per udid — reconcile ticks and our own operations, newest wins. */
  private _lastStates = new Map<string, StateNote>();
  private _memo = new Map<string, ListingMemo>();
  private _creatableMemo = new Map<string, { value: CreatableDevice | undefined; at: number }>();
  /** Lost demand, per error code — the instrument for deciding whether fail-fast is costing too much. */
  private _refusals = new Map<string, number>();
  private _driver: PoolDriver;
  private _maxPool: number;
  private _log: DriverLog;
  /** The server's signal (frozen constraint: detached work runs under it, never a client's). */
  private _controller = new AbortController();
  private _reconcileTimer?: NodeJS.Timeout;
  private _reconcileInFlight = false;
  private _loggedInventory = false;
  /**
   * Serializes allocation.
   *
   * @issue DTX-6220: the create-path race — capacity check and claim after a created device straddle `await create()`.
   *
   * Detox 20 solves the same class of problem between processes with a file
   * lock (`DeviceRegistry.registerDevice` + `lockfile.exclusively`); one
   * process needs only a promise chain.
   */
  private _lock: Promise<unknown> = Promise.resolve();

  constructor({ driver, maxPool, log }: DevicePoolDeps) {
    this._driver = driver;
    this._maxPool = maxPool;
    this._log = log;
  }

  /**
   * Starts the reconcile loop. The first pass doubles as startup: it logs the
   * one inventory line and touches nothing else — no sweep, no pre-marking of
   * booted devices as someone's property.
   */
  start(): void {
    if (this._reconcileTimer) return;
    // Captured before anything async: `_busy` starts empty every life (no
    // ownership survives a restart), and the line must say so even if an
    // allocation lands while the first listing is still running.
    const ownedAtStart = this._busy.size;
    void this._reconcile(ownedAtStart);
    this._reconcileTimer = setInterval(() => void this._reconcile(ownedAtStart), RECONCILE_INTERVAL_MS);
    this._reconcileTimer.unref();
  }

  stop(): void {
    if (this._reconcileTimer) clearInterval(this._reconcileTimer);
    this._reconcileTimer = undefined;
    this._controller.abort(new Error('Detox Server is shutting down'));
  }

  allocate(args: AllocateArgs): Promise<AllocateResult> {
    // `_lock` is always a fulfilled promise — the line below never enqueues a
    // rejection — so `.then` needs no rejection arm here.
    const result = this._lock.then(() => this._allocateExclusively(args));
    // @issue DTX-6221: a queued allocation's rejection must not poison the whole lock chain.
    this._lock = result.catch(() => undefined);
    return result;
  }

  /**
   * @issue DTX-6218: owner-checked; a stale or duplicate release is a silent no-op (spec 002 test 8).
   * @issue DTX-6222: goes back warm only when physically booted.
   * Answers whether the claim was this allocation's to drop.
   */
  release(udid: string, allocationId: string): boolean {
    const holder = this._busy.get(udid);
    if (!holder || holder.allocationId !== allocationId) return false;
    this._dropHolder(holder);
    if (this._lastStates.get(udid)?.state === 'Booted') this._warm.set(udid, Date.now());
    return true;
  }

  /**
   * Does `allocationId` still hold `udid`?
   *
   * The bookkeeping unwinds (`release`, `discardCreated`) check this
   * themselves and no-op when it is false. A *physical* unwind cannot:
   * `simctl shutdown` takes a udid and obeys, so anything that powers a
   * device down as compensation has to ask first — a rollback can outlive
   * its request by up to a minute, and in that window the udid may already
   * be released and re-allocated. An unwind that skipped this check would
   * kill a stranger's live simulator, the theft ownership records exist to
   * prevent.
   */
  isHeldBy(udid: string, allocationId: string): boolean {
    return this._busy.get(udid)?.allocationId === allocationId;
  }

  /**
   * Take the device out of circulation for the duration of a compensation's
   * own physical cleanup, or refuse when it already belongs to somebody
   * else. Returns the undo of the fence, or `undefined` for "not yours to
   * touch".
   *
   * Two questions in one call, and they must be one call. The predicate is
   * "has it moved to another allocation", not {@link isHeldBy}: powering a
   * device down needs the stricter question, because a free device is
   * capacity the keep-warm policy meant to keep, but terminating a process
   * this rollback itself started is the opposite case — on a device nobody
   * holds, that process is debris the next owner would inherit (spec 003's
   * stranded-app fix). The fence is what makes the answer survive being
   * acted on: `simctl terminate` runs up to a minute, so a check that merely
   * returned `true` would be stale long before its own command landed — the
   * pool would hand the free device to the next caller and the terminate
   * would kill their app. Fenced devices are excluded from picks and from
   * LRU eviction, exactly like {@link _evicting}; the fence never touches
   * the busy claim, so a device still ours stays ours.
   */
  fenceForCleanup(udid: string, allocationId: string): (() => void) | undefined {
    const holder = this._busy.get(udid);
    if (holder !== undefined && holder.allocationId !== allocationId) return undefined;
    this._cleaning.add(udid);
    return () => {
      this._cleaning.delete(udid);
    };
  }

  /**
   * @issue DTX-6218: owner-checked unwind of a cancelled create.
   * The claim is dropped, the device fenced off from picks, and a detached
   * rollback delete disposes of it.
   */
  discardCreated(udid: string, allocationId: string): void {
    const holder = this._busy.get(udid);
    if (!holder || holder.allocationId !== allocationId) return;
    this._dropHolder(holder);
    this._rollbackCreate([udid]);
  }

  /**
   * The device's state is unknown — the server killed a wedged operation on it.
   * Owner-checked like every other unwind: the allocation is
   * dropped (its holder gets `DETOX_STALE_HANDLE` from here on) and the udid is
   * fenced off from every future pick this server life. Not a shutdown, a
   * delete, or a probe: we do not know what the device is, so we touch
   * nothing.
   */
  markUnknown(udid: string, allocationId: string, cause: string): void {
    const holder = this._busy.get(udid);
    if (holder && holder.allocationId === allocationId) this._dropHolder(holder);
    this._warm.delete(udid);
    this._unknown.add(udid);
    this._log.error(
      `device ${udid} is in an UNKNOWN state (${cause}) — excluded from allocation until this server restarts`,
      { udid, cause },
    );
  }

  /**
   * Wires the completed allocation to its connection's push channel. From here
   * on the reconcile loop is the only voice that tells this client about state
   * (the push channel as sole writer — spec 002).
   */
  attachNotifier(allocationId: string, notify: (state: DeviceRuntimeState) => void): void {
    const holder = this._holderOf(allocationId);
    if (!holder) return;
    holder.notify = notify;
    // The allocate response already said `booted`; re-pushing it would be noise.
    holder.lastNotified = 'booted';
    holder.noteAt = Date.now();
  }

  /** @issue DTX-6223: pushed to the client immediately, and stamped against a stale reconcile sample. */
  noteOperationalState(allocationId: string, state: 'booted' | 'shutdown'): void {
    const holder = this._holderOf(allocationId);
    if (!holder) return;
    holder.lastNotified = state;
    holder.noteAt = Date.now();
    this.noteState(holder.udid, state === 'booted' ? 'Booted' : 'Shutdown');
    holder.notify?.(state);
  }

  /**
   * Freshest-state hint from our own operations (e.g. the boot inside
   * allocation). Timestamped, so a reconcile tick whose listing was sampled
   * *before* the operation cannot overwrite it back — without the stamp, a
   * stale sample landing between a boot and its release would silently cost
   * the device its warm-pool membership.
   */
  noteState(udid: string, simctlState: string): void {
    this._lastStates.set(udid, { state: simctlState, at: Date.now() });
  }

  get busyCount(): number {
    return this._busy.size;
  }

  /**
   * Match first, cap second — the only order that keeps a query nothing can
   * ever satisfy from being reported as a merely-full pool (spec 004: terminal
   * beats transient). A query matching no existing simulator is still a
   * *match* when the device type is creatable (spec 002 test 3): capacity
   * applies to it, terminality does not.
   */
  private async _allocateExclusively(args: AllocateArgs): Promise<AllocateResult> {
    const { allocationId, query, signal, filter } = args;
    // A caller that vanished while queued on the lock gets nothing further —
    // no listing, no eviction on its behalf, no refusal-counter pollution.
    signal?.throwIfAborted();
    // The driver's own `list` already narrows to its platform (spec 015); an
    // extra `filter` narrows further (a generic convenience, test-driven).
    const listed = await this._listWithMemo(query, signal);
    const devices = filter ? listed.filter(filter) : listed;

    if (!devices.length) {
      const creatable = await this._creatable(args);
      if (!creatable) throw this._refuseNoMatch(args);
      this._requireCapacity();
      this._makeRoom();
      const { model } = creatable;
      const udid = await this._createWithRollback({
        name: model,
        deviceTypeIdentifier: creatable.deviceTypeIdentifier,
        runtimeIdentifier: creatable.runtime.identifier,
        signal,
      });
      return this._claim({
        allocationId,
        udid,
        device: {
          udid,
          name: model,
          state: 'Shutdown',
          type: creatable.deviceTypeIdentifier,
          os: {
            identifier: creatable.runtime.identifier,
            version: creatable.runtime.version,
            name: creatable.runtime.name,
            platform: 'iOS',
          },
        },
        created: true,
      });
    }

    this._requireCapacity();

    // @issue DTX-6224: held, mid-unwind, or unknown are all unpickable.
    const free = devices
      .filter(
        (d) =>
          !this._busy.has(d.udid) &&
          !this._evicting.has(d.udid) &&
          !this._unknown.has(d.udid) &&
          !this._cleaning.has(d.udid),
      )
      .map((d) => this._patchState(d));
    const pick = this._pickFree(free);
    if (pick) {
      this._makeRoom(pick.udid);
      return this._claim({ allocationId, udid: pick.udid, device: pick, created: false });
    }

    // @issue DTX-6225: every match held or mid-unwind refuses instantly and typed, never a created sibling.
    // @issue DTX-6224: DETOX_POOL_EXHAUSTED stays even when every match is unknown; the message must not say "busy".
    const unknown = devices.filter((d) => this._unknown.has(d.udid)).map((d) => d.udid);
    const otherwiseUnavailable = devices.length - unknown.length;
    throw this._refuseExhausted(
      otherwiseUnavailable === 0
        ? `Every simulator matching ${JSON.stringify(query)} (${unknown.length}) is in an unknown state ` +
            'after a killed operation — restarting the Detox Server clears it'
        : `Every simulator matching ${JSON.stringify(query)} is busy` +
            (unknown.length > 0 ? ` (${unknown.length} of them in an unknown state)` : ''),
      unknown,
    );
  }

  /**
   * @issue DTX-6227: fail-fast on a full pool; only held devices count toward the cap.
   * @issue DTX-6226: unknown-state devices count too — still occupying the Mac.
   */
  private _requireCapacity(): void {
    if (this._busy.size + this._unknown.size < this._maxPool) return;
    const unknown = [...this._unknown];
    throw this._refuseExhausted(
      `All ${this._maxPool} device slots are taken (${this._busy.size} busy` +
        (unknown.length > 0 ? `, ${unknown.length} in an unknown state` : '') +
        ')',
      unknown,
    );
  }

  private _refuseExhausted(message: string, unknown: readonly string[] = []): DevicePoolExhaustedError {
    this._countRefusal('DETOX_POOL_EXHAUSTED');
    return new DevicePoolExhaustedError(message, {
      details: {
        maxPool: this._maxPool,
        holders: this._holders(),
        // Additive (the error payload may grow, never change shape): present only
        // when unknown-state devices are part of why this refusal happened, so
        // a consumer can tell "wait for a holder" from "restart the server".
        ...(unknown.length > 0 ? { unknown: [...unknown] } : {}),
      },
    });
  }

  private _refuseNoMatch({ query, requestedType }: AllocateArgs): NoMatchingDeviceError {
    this._countRefusal('DETOX_NO_MATCHING_DEVICE');
    return new NoMatchingDeviceError(
      `No simulator matching ${JSON.stringify(query)}${requestedType ? ` (type: ${requestedType})` : ''}`,
      { details: { query, ...(requestedType ? { requestedType } : {}) } },
    );
  }

  /**
   * Frees one slot for a claim that needs it.
   * @issue DTX-6228: a pick that is itself warm reuses its own slot.
   * @issue DTX-6229: only devices this life handed out are ever in `_warm`.
   * Otherwise warm devices fill the cap; the LRU one is shut
   * down, detached, under the server's signal, never a client's.
   */
  private _makeRoom(pickUdid?: string): void {
    if (pickUdid !== undefined && this._warm.delete(pickUdid)) return;
    // Unknown devices count here for the same reason they count in
    // `_requireCapacity`: they occupy the host, and a warm device must be
    // evicted to make room for the slot they are sitting on.
    while (this._busy.size + this._warm.size + this._unknown.size >= this._maxPool && this._warm.size > 0) {
      let lruUdid: string | undefined;
      let lruAt = Infinity;
      for (const [udid, releasedAt] of this._warm) {
        // A device under cleanup is capacity we cannot reclaim yet: shutting it
        // down would run a second simctl command against a device that already
        // has one in flight (`fenceForCleanup`).
        if (this._cleaning.has(udid)) continue;
        if (releasedAt < lruAt) {
          lruAt = releasedAt;
          lruUdid = udid;
        }
      }
      if (lruUdid === undefined) return;
      this._evict(lruUdid);
    }
  }

  private _evict(udid: string): void {
    this._warm.delete(udid);
    this._evicting.add(udid);
    this._log.info(`evicting warm device ${udid} (LRU, pool at capacity)`, { udid });
    this._driver
      .shutdown({ udid, signal: this._controller.signal })
      .then(() => this.noteState(udid, 'Shutdown'))
      .catch((err) => {
        this._log.error(`eviction shutdown failed for ${udid}: ${describeError(err)}`, { udid });
        // @issue DTX-6230: still booted on refusal — back into the warm set, not leaked untracked.
        this._warm.set(udid, Date.now());
      })
      .finally(() => this._evicting.delete(udid));
  }

  private _claim({ allocationId, udid, device, created }: AllocateResult): AllocateResult {
    const now = Date.now();
    this._busy.set(udid, {
      allocationId,
      udid,
      startedAt: now,
      lastNotified: null,
      noteAt: now,
    });
    this._byAllocation.set(allocationId, udid);
    return { allocationId, udid, device, created };
  }

  /** Every device this server life has handed out — cross-connection (spec 004 accept test 1). */
  private _holders(): Array<{ allocationId: string; udid: string; ageMs: number }> {
    const now = Date.now();
    return [...this._busy.values()].map((holder) => ({
      allocationId: holder.allocationId,
      udid: holder.udid,
      // Hold age, never idle age: the name is frozen by accept-004, the
      // definition by spec 002 (idle age never enters the wire).
      ageMs: now - holder.startedAt,
    }));
  }

  private _holderOf(allocationId: string): Holder | undefined {
    const udid = this._byAllocation.get(allocationId);
    return udid === undefined ? undefined : this._busy.get(udid);
  }

  private _dropHolder(holder: Holder): void {
    this._busy.delete(holder.udid);
    this._byAllocation.delete(holder.allocationId);
  }

  private _countRefusal(code: string): void {
    const count = (this._refusals.get(code) ?? 0) + 1;
    this._refusals.set(code, count);
    // Logs are the only surface (spec 002: no wire API for metrics), so lost
    // demand must be measurable from them. Sampled past the first few —
    // retry loops are the documented idiom, and one line per
    // refused retry would grow logs (and the accept helper's in-memory
    // stdout) without bound.
    if (count <= REFUSAL_LOG_FIRST || count % REFUSAL_LOG_EVERY === 0) {
      this._log.info(`allocation refused (${code}) — ${count} such refusal(s) this life`, { code, count });
    }
  }

  private async _listWithMemo(
    query: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<DeviceInfo[]> {
    const key = memoKey(query);
    const memo = this._memo.get(key);
    if (memo && Date.now() - memo.at < LISTING_MEMO_TTL_MS) return memo.devices;
    const devices = await this._driver.list({ query, signal });
    this._storeMemo(key, devices);
    return devices;
  }

  private _storeMemo(key: string, devices: DeviceInfo[]): void {
    this._memo.delete(key);
    this._memo.set(key, { devices, at: Date.now() });
    if (this._memo.size > LISTING_MEMO_MAX_ENTRIES) {
      const oldest = this._memo.keys().next();
      if (!oldest.done) this._memo.delete(oldest.value);
    }
  }

  /**
   * Whether an unmatched query could be answered by creating a device — the
   * driver's call (spec 015; on iOS only a `byType` query is creatable). A
   * driver without `creatable`/`create` never creates.
   */
  private async _creatable({ query, signal }: AllocateArgs): Promise<CreatableDevice | undefined> {
    const driver = this._driver;
    if (!driver.creatable || !driver.create) return undefined;
    // Memoized: this sits on the terminal-refusal path, and a client
    // retry-looping on an unsatisfiable model must not spawn one
    // `simctl list runtimes` per attempt. Installed runtimes change rarely.
    const key = memoKey(query);
    const memo = this._creatableMemo.get(key);
    if (memo && Date.now() - memo.at < CREATABLE_MEMO_TTL_MS) {
      return memo.value;
    }
    const found = await driver.creatable({ query, signal });
    this._creatableMemo.set(key, { value: found, at: Date.now() });
    if (this._creatableMemo.size > LISTING_MEMO_MAX_ENTRIES) {
      const oldest = this._creatableMemo.keys().next();
      if (!oldest.done) this._creatableMemo.delete(oldest.value);
    }
    return found;
  }

  /** The driver's platform-wide listing, for the rollback's leftover hunt; a driver without one sees no leftovers. */
  private _rawDevices(signal: AbortSignal | undefined): Promise<readonly { udid: string; name: string }[]> {
    return this._driver.rawDevices ? this._driver.rawDevices({ signal }) : Promise.resolve([]);
  }

  /**
   * Runs `simctl create`.
   * @issue DTX-6231: a cancellation or failure deletes whatever it made.
   * @issue DTX-6232: the pre-create snapshot scopes rollback to what this create added.
   */
  private async _createWithRollback(args: PoolCreateArgs): Promise<string> {
    const { name, deviceTypeIdentifier, runtimeIdentifier, signal } = args;
    const create = this._driver.create?.bind(this._driver);
    if (!create) throw new Error('the driver answered creatable without a create verb');
    const before = new Set(
      (await this._rawDevices(signal))
        .filter((d) => d.name === name)
        .map((d) => d.udid),
    );
    let udid: string | undefined;
    try {
      udid = await create({ name, deviceTypeIdentifier, runtimeIdentifier, signal });
      // Anything can query this model from here on — the memoized listing no
      // longer reflects the fleet.
      this._memo.clear();
      // The create finished, but the caller is gone: the device is a half-made
      // leftover of a cancelled creation, which is always deleted.
      signal?.throwIfAborted();
      return udid;
    } catch (err) {
      // The candidate udids are resolved here, while the allocation lock is
      // still held: no concurrent create for the same model can have
      // started, so any same-named device not in `before` was made by this
      // call. Resolving them later (detached) would be guessing by name
      // across time, risking deletion of a simulator some other allocation
      // has since created and handed out. If we cannot even list, we give
      // up rather than guess: a leaked simulator is cheaper than a broken
      // pool.
      let candidates: string[];
      if (udid !== undefined) {
        candidates = [udid];
      } else {
        candidates = await this._rawDevices(this._controller.signal)
          .then((listed) => listed.filter((d) => d.name === name && !before.has(d.udid)).map((d) => d.udid))
          .catch(() => {
            this._log.error(`cannot list leftovers of the failed "${name}" create — giving up, not guessing`);
            return [] as string[];
          });
      }
      this._rollbackCreate(candidates);
      throw err;
    }
  }

  /**
   * Deletes exactly the given udids — never a name-based guess. Detached:
   * the rejection this rollback belongs to has already been sent, and
   * holding the allocation lock for up to 30s would stall every other
   * allocation. Runs under the server's signal (the client that cancelled
   * has no say in the cleanup). The udids are fenced off from picks until
   * the delete settles, and a udid some allocation has claimed in the
   * meantime is left strictly alone.
   * @issue DTX-6233: retries a refused delete; unfences once a later listing shows the device gone.
   */
  private _rollbackCreate(candidates: readonly string[]): void {
    if (candidates.length === 0) return;
    const deleteDevice = this._driver.deleteDevice?.bind(this._driver);
    if (!deleteDevice) {
      this._log.error(`cannot delete half-made device(s) after a cancelled create: the driver has no delete verb: ${candidates.join(', ')}`);
      return;
    }
    const signal = this._controller.signal;
    for (const udid of candidates) this._evicting.add(udid);
    const unfence = (): void => {
      for (const udid of candidates) {
        this._evicting.delete(udid);
      }
    };
    void (async () => {
      try {
        for (let attempt = 0; attempt < ROLLBACK_ATTEMPTS && !signal.aborted; attempt++) {
          try {
            const listed = new Set((await this._rawDevices(signal)).map((d) => d.udid));
            const leftovers = candidates.filter((udid) => listed.has(udid) && !this._busy.has(udid));
            if (leftovers.length === 0) return;
            for (const udid of leftovers) {
              await deleteDevice({ udid, signal })
                .then(() => {
                  this._lastStates.delete(udid);
                  this._memo.clear();
                })
                .catch(() => undefined);
            }
          } catch {
            // Listing hiccups retry along with stubborn deletes.
          }
          await new Promise((resolve) => setTimeout(resolve, ROLLBACK_RETRY_MS).unref());
        }
        if (!signal.aborted) {
          this._log.error(
            `could not delete half-made simulator(s) after a cancelled create: ${candidates.join(', ')}`,
            { udids: candidates },
          );
        }
      } finally {
        unfence();
      }
    })();
  }

  /** The listing's state, corrected by anything fresher our own operations know. */
  private _patchState(device: DeviceInfo): DeviceInfo {
    const known = this._lastStates.get(device.udid)?.state;
    return known !== undefined && known !== device.state ? { ...device, state: known } : device;
  }

  /**
   * @issue DTX-6234: the query is the contract — a client that asked for
   * nothing gets nothing.
   *
   * Ordering is unspecified, which keeps this free to change: booted-beats-
   * shutdown is the whole cost model, and changing it stays an internal,
   * non-breaking edit.
   */
  private _pickFree(free: readonly DeviceInfo[]): DeviceInfo | undefined {
    return free.find((d) => d.state === 'Booted') ?? free[0];
  }

  /**
   * One serialized loop, not per-allocation watchers: one listing per tick,
   * diffed against what each client was last told, fanned out in deterministic
   * order. Because every tick runs on the same serialized loop, two ticks
   * can never interleave, which removes the class of bug per-allocation
   * pollers had. The notification it feeds promises only that an
   * out-of-band change is *eventually noticed*: the listing is a sample,
   * and a within-tick bounce leaves no evidence.
   */
  private async _reconcile(ownedAtStart: number): Promise<void> {
    if (this._reconcileInFlight) return;
    // With nothing to watch — no holders to notify, no warmth to verify, no
    // unwind in flight — a tick would spawn a listing for nobody. An always-on
    // server must idle quietly; the memo simply goes cold and the next
    // allocation pays one listing.
    if (
      this._loggedInventory &&
      this._busy.size === 0 &&
      this._warm.size === 0 &&
      this._evicting.size === 0
    ) {
      return;
    }
    this._reconcileInFlight = true;
    try {
      const tickStart = Date.now();
      const listing = await this._driver.list({ query: {}, signal: this._controller.signal });
      this._storeMemo(memoKey({}), listing);
      const states = new Map(listing.map((d) => [d.udid, d.state]));

      for (const holder of this._busy.values()) {
        if (!holder.notify) continue;
        // A request-driven transition happened after this sample was taken —
        // the sample is history, not news (the two-writers fix).
        if (holder.noteAt >= tickStart) continue;
        const state = toRuntimeState(states.get(holder.udid) ?? 'Shutdown');
        if (state === holder.lastNotified) continue;
        // `lastNotified` only advances after the push went out — a throwing
        // notifier must not mark the state as delivered — and one broken
        // notifier must not silence the rest of the fan-out or the tick.
        try {
          holder.notify(state);
          holder.lastNotified = state;
        } catch (err) {
          this._log.error(`deviceStateChanged push failed for ${holder.udid}: ${describeError(err)}`);
        }
      }

      // Freshest writer wins: an operation-sourced note stamped after this
      // tick's listing started outlives the (older) sample.
      const down: string[] = [];
      for (const [udid, state] of states) {
        const known = this._lastStates.get(udid);
        if (known && known.at >= tickStart) continue;
        this._lastStates.set(udid, { state, at: tickStart });
        if (state !== 'Booted') down.push(udid);
      }
      for (const [udid, known] of [...this._lastStates]) {
        if (!states.has(udid) && known.at < tickStart) {
          this._lastStates.delete(udid);
          down.push(udid);
        }
      }
      // A device the platform shows down or gone — quit from Simulator.app, a
      // manual shutdown, a delete — has no gateway to keep: the driver closes
      // its object (the listener lives with the booted device).
      if (this._driver.deviceWentDown) {
        for (const udid of down) {
          this._driver.deviceWentDown(udid).catch((err: unknown) => {
            this._log.error(`closing the device object of ${udid} after it went down failed: ${describeError(err)}`, { udid });
          });
        }
      }
      // Warmth is physical: a warm device something else shut down or deleted
      // is not capacity we are keeping — it is just cold, and free.
      for (const udid of [...this._warm.keys()]) {
        if (this._lastStates.get(udid)?.state !== 'Booted') this._warm.delete(udid);
      }

      if (!this._loggedInventory) {
        this._loggedInventory = true;
        const booted = listing.filter((d) => d.state === 'Booted').length;
        // The format is contract-adjacent (spec 002 test 6 greps it): no
        // ownership survives a restart. Nothing is deleted at startup — there
        // is no create-intent journal yet, so a previous life's half-made
        // leftovers are not attributable, hence not touchable.
        this._log.info(`startup inventory: ${booted} booted, ${ownedAtStart} owned, 0 half-made deleted`, { booted, owned: ownedAtStart });
      }
    } catch {
      // A wedged listing is this tick's problem, not the loop's: try again next tick.
    } finally {
      this._reconcileInFlight = false;
    }
  }
}
