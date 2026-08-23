/**
 * The compat surface's singleton state, extracted behind a cross-realm box
 * (spec 010). The surface has exactly one singleton — this is still it; what
 * changed is where it lives, and why:
 *
 * Under jest, the same compat surface is evaluated more than once in one
 * process — the test environment's own bundle loads in the worker's outer
 * realm, while a fixture's `require('detox')` evaluates a second copy inside
 * jest's per-file module registry (its own realm, its own module state). Both
 * copies must mean the same session, or `exposeGlobals: false` projects
 * would drive an uninitialized ghost. So the state hangs off `globalThis`
 * under a `Symbol.for` key: the global symbol registry is per-isolate, so the
 * key agrees across copies and across vm contexts, and the environment
 * mirrors the box onto each test context's global before any fixture loads.
 *
 * Outside jest nothing changes observably: the first copy to load creates
 * the box, and a plain node process has exactly one copy anyway.
 *
 * This module is @internal — the runner integration's door into compat.
 * It is not exported by the package surface and `specs/**` never names it.
 */
import type { Detox, DetoxApp, DetoxDevice } from 'detox/internals';

import { LaunchArgsEditor } from './launch-args';
import type { CompatAppConfig } from './index';

/** An app after init resolved its identity (`bundleId` derived from the binary when absent). */
export type ResolvedCompatApp = CompatAppConfig & { bundleId: string };

export interface CompatState {
  session: Detox;
  device: DetoxDevice;
  apps: readonly ResolvedCompatApp[];
  /** @issue DTX-4016: `selectApp(null)` clears this. */
  selected: ResolvedCompatApp | undefined;
  /**
   * At most one app runs under the compat surface at a time, because v20's
   * own `selectApp` terminates the outgoing app before switching
   * (`RuntimeDevice.js:93-100`) — so a single handle is all the state needed.
   * (The new API happily runs two handles on one device; that freedom is
   * `detox/client`'s, not this shim's.)
   */
  currentApp: DetoxApp | undefined;
}

export interface CompatStateBox {
  state: CompatState | undefined;
  /** In-flight `init()` — the guard two overlapping inits and a mid-init `cleanup()` both need. */
  pendingInit: Promise<void> | undefined;
  /**
   * `device.appLaunchArgs` (v20's `LaunchArgsEditor`). Deliberately outside
   * `CompatState`: v20 hands the editor out at module load, and a fixture
   * that captured it before `init()` must keep addressing the same object
   * after `cleanup()`.
   */
  launchArgsEditor: LaunchArgsEditor;
  /**
   * The ambient abort signal (spec 010): when set, every client call started
   * by this surface composes this signal in — sampled at call time, so the
   * jest environment can point it at the current test's scope and a hung
   * call dies with the test instead of outliving it.
   * Undefined everywhere outside the runner integration.
   */
  ambient: AbortSignal | undefined;
  /** Set by the jest environment before `init` — an idle session must not hold a worker open. */
  unrefSocket: boolean;
}

export const COMPAT_STATE_KEY = Symbol.for('detox-compat.state.v21');

type BoxCarrier = Record<symbol, CompatStateBox | undefined>;

/**
 * The one box for this realm: found on `globalThis` (another copy, or the
 * jest environment mirroring its own across the context boundary) or created
 * here, first copy wins.
 */
export function compatStateBox(): CompatStateBox {
  const carrier = globalThis as unknown as BoxCarrier;
  let box = carrier[COMPAT_STATE_KEY];
  if (box === undefined) {
    box = {
      state: undefined,
      pendingInit: undefined,
      launchArgsEditor: new LaunchArgsEditor(),
      ambient: undefined,
      unrefSocket: false,
    };
    carrier[COMPAT_STATE_KEY] = box;
  }
  return box;
}
