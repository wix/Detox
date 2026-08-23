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
import type { DetoxDevice } from 'detox/internals';
import { DetoxErrorCode } from 'detox/internals';

/* ───────────────────────── spec 005 — COLLAPSED ───────────────────────── */

/** The real public type now — no longer a forward declaration. */
export type { StatusBarOverrides } from 'detox/internals';

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
} from 'detox/internals';

/** The handle is public as {@link DetoxApp}; the door keeps its old name. */
export type { DetoxApp as AppHandle } from 'detox/internals';

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
