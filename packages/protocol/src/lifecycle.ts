// Device lifecycle beyond allocation: boot / shutdown / release, plus the
// push channel that keeps the client's view of device state current.

/** Runtime state of a device as the server reports it (lowercase dialect). */
export type DeviceRuntimeState = 'shutdown' | 'booting' | 'booted' | 'shutting-down';

/**
 * Operations the server narrates through `$/progress`. The names match the
 * client's public operation vocabulary: the client routes progress to
 * operation objects by this name.
 */
export type LifecycleOperationName =
  | 'allocateDevice'
  | 'boot'
  | 'shutdown'
  | 'release'
  // @issue DTX-2011: a multi-step utility (spec 005's wipe) narrates under
  // its own name.
  // @issue DTX-2008: …and spawns the same `boot` child every physical boot
  // does.
  // Quick one-shot utilities narrate nothing: no progress to report for a
  // command that returns in milliseconds.
  | 'resetContentAndSettings'
  // A multi-hundred-megabyte upload is not a quick one-shot utility: the
  // install verb narrates fetch/unpack/install progress (spec 007).
  | 'installApp';

/**
 * The value carried by a `$/progress` notification for lifecycle requests.
 *
 * @issue DTX-2008: `begin`/`end` bracket a sub-operation the server started
 * on its own (e.g. the boot inside a wipe) so the client can surface it as
 * a child operation. The request's own narration uses `kind: 'progress'`
 * with `op` equal to the request's operation name.
 */
export interface OperationProgress {
  op: LifecycleOperationName;
  kind: 'begin' | 'progress' | 'end';
  message?: string;
  /** @issue DTX-2010: present on `kind: 'end'` — whether the sub-operation succeeded. */
  ok?: boolean;
}

export interface BootDeviceRequest {
  allocationId: string;
}

export interface BootDeviceResponse {
  state: 'booted';
}

export interface ShutdownDeviceRequest {
  allocationId: string;
}

export interface ShutdownDeviceResponse {
  state: 'shutdown';
}

export interface ReleaseDeviceRequest {
  allocationId: string;
}

export interface ReleaseDeviceResponse {
  released: boolean;
}

/**
 * Unsolicited server→client push: the watched device changed state, whether
 * we caused it or something outside Detox did.
 *
 * @issue DTX-2007: sampled — the server polls the ground
 * truth and pushes only when it differs from what the client was last told.
 *
 * The contract is only that an out-of-band change is eventually noticed —
 * cadence, coalescing of within-tick bounces, and cross-device ordering are
 * all unspecified, so strengthening later stays additive.
 *
 * @issue DTX-2009: request-driven transitions (boot/shutdown) are pushed
 * before their response resolves.
 */
export interface DeviceStateChangedNotification {
  allocationId: string;
  state: DeviceRuntimeState;
}
