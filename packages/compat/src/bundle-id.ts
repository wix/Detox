/**
 * `bundleId` derivation from a built `.app` (spec 009):
 * `bundleId` is optional in the config and derived client-side from
 * `binaryPath`'s Info.plist at `connect` — one call before the v20-ordered
 * uninstall-then-install, never at config-resolution time (that would break
 * `detox build` on an app not yet built) and never baked into the snapshot.
 *
 * Port of Detox 20 `SimulatorDriver.getBundleIdFromBinary`
 * (`src/devices/runtime/drivers/ios/SimulatorDriver.js:72-83`, PlistBuddy).
 * Memoized per binary path, as v20 memoizes it (`:40`).
 * @issue DTX-4033: a failed read is evicted from the cache — this cache is module-scoped where
 * v20's was per-driver-instance, and a transient failure must not poison every later init.
 *
 * The plist read is a child process and takes `signal`. A second caller
 * memoized onto the first's in-flight read shares the first caller's signal
 * — acceptable: both are the same init.
 */
import { execFile } from 'node:child_process';
import path from 'node:path';

import { DetoxError, DetoxErrorCode } from 'detox/client';

const cache = new Map<string, Promise<string>>();

/** Test seam: a fresh process has an empty cache; units get one too. */
export function clearBundleIdCache(): void {
  cache.clear();
}

export function getBundleIdFromBinary(binaryPath: string, signal?: AbortSignal): Promise<string> {
  const absPath = path.resolve(binaryPath);
  const hit = cache.get(absPath);
  if (hit !== undefined) return hit;
  const pending = readCFBundleIdentifier(absPath, signal);
  cache.set(absPath, pending);
  pending.catch(() => cache.delete(absPath));
  return pending;
}

function readCFBundleIdentifier(absPath: string, signal?: AbortSignal): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    execFile(
      '/usr/libexec/PlistBuddy',
      ['-c', 'Print CFBundleIdentifier', path.join(absPath, 'Info.plist')],
      { signal },
      (error, stdout) => {
        const bundleId = stdout.trim();
        if (error !== null || bundleId === '') {
          reject(
            new DetoxError(
              // v20's message, kept: the path is the actionable part.
              `field CFBundleIdentifier not found inside Info.plist of app binary at ${absPath}`,
              {
                code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
                details: { method: 'init', parameter: 'binaryPath' },
              },
            ),
          );
          return;
        }
        resolve(bundleId);
      },
    );
  });
}
