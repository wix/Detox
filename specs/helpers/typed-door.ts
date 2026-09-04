/**
 * Typed doors — editable scaffolding between frozen accept files and the
 * public API. Accept files carry no scaffolding types of their own; this
 * module holds them.
 *
 * Two sections live here:
 *  - spec 005's door, collapsed: the implementation landed, so its types are
 *    re-exports and its function is the identity. It stays because the accept
 *    file's imports are frozen.
 *  - spec 003's door, collapsed the same way: interfaces are re-exports of
 *    the real public types, `launchAppVia` lost its cast, and
 *    `APP_GATEWAY_CODES` re-exports `DetoxErrorCode` members. While a door is
 *    open, a code value here is a placeholder pin, not a minted code:
 *    codes are minted only in `packages/core/src/errors.ts`,
 *    and the collapse replaces the placeholder with the real constant.
 */
import type {
  Detox,
  DetoxCallOptions,
  DetoxDevice,
  DetoxLogAttrs,
  DetoxLogKind,
  DetoxOperation,
} from 'detox/client';
import { DetoxErrorCode } from 'detox/client';

/* ───────────────────────── spec 005 — COLLAPSED ───────────────────────── */

/** The real public type now — no longer a forward declaration. */
export type { StatusBarOverrides } from 'detox/client';

/**
 * The seam the 005 accept file reaches the utilities through: the identity
 * function, so a method that disappeared from `DetoxDevice`, or changed its
 * signature, fails the accept suite's typecheck instead of at run time.
 */
export const utilitiesOf = (device: DetoxDevice): DetoxDevice => device;

/* ───────────────────────── spec 003 — COLLAPSED ───────────────────────── */

/** The real public types. */
export type {
  AppCallOptions,
  AppMatcher,
  AppBy,
  AppElement,
  AppExpectation,
  AppWaitFor,
} from 'detox/client';

/** The handle is public as {@link DetoxApp}; the door keeps its old name. */
export type { DetoxApp as AppHandle } from 'detox/client';

/**
 * A slice of the real `DetoxDevice`'s two verbs, so a verb that drifted
 * would fail the accept typecheck.
 */
export type AppGatewayDoor = Pick<DetoxDevice, 'launchApp' | 'installApp'>;

/**
 * The identity function, same pattern as `utilitiesOf` above: applied once
 * per test after allocation, and every later line typechecks against the real
 * public API without the frozen file ever being edited.
 */
export const appsOf = (device: DetoxDevice): DetoxDevice => device;

/**
 * Re-exports of the minted constants (`packages/core/src/errors.ts` — the
 * only registry).
 */
export const APP_GATEWAY_CODES = {
  DETOX_APP_DIED: DetoxErrorCode.DETOX_APP_DIED,
  DETOX_EXPECTATION_FAILED: DetoxErrorCode.DETOX_EXPECTATION_FAILED,
} as const;

/* ───────────────────────── spec 012 — COLLAPSED ───────────────────────── */

/**
 * The connection-log door: `runId` and `log.begin` are on the real
 * `Detox` handle, so the door is the identity, and a spelling that drifts
 * fails the accept typecheck.
 */
export const logOf = (detox: Detox): Detox => detox;

/**
 * The raw spellings the accept suite sends past the client's types: the
 * client forwards `kind` and `attrs` unvalidated — the server is the judge —
 * so the refusal lines are reachable from the public dialect. A cast in an
 * editable helper, never inline in the frozen file.
 */
export const rawLogKind = (kind: string): DetoxLogKind => kind as DetoxLogKind;
export const rawAttrs = (attrs: Record<string, unknown>): DetoxLogAttrs => attrs as DetoxLogAttrs;

/* ───────────────────────── spec 015 — COLLAPSED ────────────────────────── */

/**
 * The drivers door (spec 015), collapsed: `device.apps`
 * (`launch`/`activate`/`attach`/`connected`/`serverUrl`) is public on the
 * real {@link DetoxDevice}, so `appsOf015` is the identity. `allocateAnyOf`
 * stays a cast on purpose: the client's `type` is `keyof AllocationMap` — a
 * driver package augments the map with its own entry — and the accept file
 * also names types nothing declares (`'no-such-driver-package'`, a path) to
 * pin their refusals. Widening `type` to a bare string is the editable
 * helper's job, never an inline cast in the frozen file.
 */

/** The real public type now — no longer a forward declaration. */
export type { DeviceApps } from 'detox/client';

/** Worn once per test after allocation; the identity now that `apps` is public — generic, so `info` keeps its narrowing. */
export const appsOf015 = <D extends DetoxDevice>(device: D): D => device;

/** `allocateDevice` with the wire's own typing: any driver name, any query. */
export interface AnyDriverDetox extends Omit<Detox, 'allocateDevice'> {
  allocateDevice(
    options: DetoxCallOptions & { type: string; device?: unknown },
  ): DetoxOperation<DetoxDevice, 'allocateDevice'>;
}

/** The wire admits any driver name; the typed map is a client-side view (spec 015). */
export const allocateAnyOf = (detox: Detox): AnyDriverDetox => detox;
