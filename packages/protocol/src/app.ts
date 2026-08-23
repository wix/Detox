// App-level actions — communication with a running app via the app gateway.

import type { DeviceActionParams } from './device';

/**
 * Every app action names the device's allocation and the server-minted
 * per-launch app handle (spec 003): a udid is never an address, and a bare
 * bundle id cannot distinguish a relaunch's fresh instance from its dead
 * predecessor.
 *
 * @issue DTX-2000: check order — device ownership, then app-handle
 * liveness, then the action's own failures.
 *
 * `appHandleId` is an opaque string the server alone composes — nothing may
 * parse meaning out of it (spec 003 forward constraint: instance identity
 * must be able to absorb reconnects without a client contract change).
 */
export interface AppActionParams extends DeviceActionParams {
  appHandleId: string;
}

// Element interactions (invoke)

export interface InvokeParams extends AppActionParams {
  /**
   * @issue DTX-2003: the frozen-dialect invocation, relayed verbatim as the
   * `invoke` frame's params — byte-for-byte what Detox 20's serializer
   * produces.
   */
  invocation: Record<string, unknown>;
}

export interface InvokeResult {
  result?: unknown;
}

// App runtime actions. Unwired verbs still carry the full app address, so the
// server can refuse them in the uniform order (ownership, then liveness, then
// DETOX_NOT_IMPLEMENTED) instead of leaking a raw -32601.

export type ReloadReactNativeParams = AppActionParams;

export type WaitForBackgroundParams = AppActionParams;

export type WaitForActiveParams = AppActionParams;

/**
 * @issue DTX-6028: `foreground` is a resume of the launched instance (spec
 * 006), never a new launch — same pid, no second handshake.
 * @issue DTX-6029: a dead handle answers `DETOX_APP_DIED`.
 */
export type ForegroundAppParams = AppActionParams;

export type ShakeParams = AppActionParams;

export interface SetOrientationParams extends AppActionParams {
  orientation: 'portrait' | 'landscape';
}

/**
 * Payload delivery to the running app (spec 006), relay-safe by shape.
 *
 * @issue DTX-2001: `userNotification` / `userActivity` cross as values; the
 * server materializes each to its own file and puts that path on the
 * frozen `deliverPayload` frame. `delayPayload` maps to the frame's own
 * flag. `url` crosses verbatim, never as a file.
 * @issue DTX-2002: the earlier draft's client-machine path fields are gone —
 * a version-skew refusal, never a silent read of that field. Exactly one of
 * `url` / `userNotification` / `userActivity` may be present.
 */
export interface DeliverPayloadParams extends AppActionParams {
  url?: string;
  sourceApp?: string;
  userNotification?: unknown;
  userActivity?: unknown;
  delayPayload?: boolean;
}

// Sync settings (via WS)

export interface SetSyncSettingsParams extends AppActionParams {
  blacklistURLs?: string[];
  enabled?: boolean;
}

export type CurrentStatusParams = AppActionParams;

export interface CurrentStatusResult {
  status: unknown;
}

// View hierarchy (via WS)

export interface CaptureViewHierarchyParams extends AppActionParams {
  viewHierarchyURL?: string;
}

export interface CaptureViewHierarchyResult {
  captureViewHierarchyError?: string;
}

export interface GenerateViewHierarchyXmlParams extends AppActionParams {
  shouldInjectTestIds?: boolean;
}

export interface GenerateViewHierarchyXmlResult {
  viewHierarchy: string;
}
