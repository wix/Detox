/**
 * Typed door for spec 006 — launch options. Accept files carry no
 * scaffolding types of their own; this module holds them.
 *
 * Collapsed: the launch-options surface exists on the real public API now,
 * so the forward declarations are re-exports and `launchingOf` is the
 * identity — the frozen accept file typechecks against `detox/client`
 * itself, the same pattern as the 003/005 doors.
 */
import type { DetoxDevice } from 'detox/client';

export type {
  LaunchAppOptions as LaunchOptionsDoor,
  AppPayloadOptions as AppPayloadOptionsDoor,
  DetoxApp as LaunchedAppDoor,
  DetoxDevice as LaunchingDeviceDoor,
} from 'detox/client';

/** The identity function, applied once per test. */
export const launchingOf = (device: DetoxDevice): DetoxDevice => device;
