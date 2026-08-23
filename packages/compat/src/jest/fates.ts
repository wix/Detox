/**
 * The 010 fate table (no silent half-implementations): the vocabulary
 * spec 009 forwarded into the snapshot for this spec to consume. One key is
 * consumed (`behavior.init.exposeGlobals`, read in `snapshot.ts`); the rest
 * warn once per key per process, each naming itself, why it is inert, and
 * its heir. Unknown keys under `testRunner.jest` warn as unknown.
 *
 * Worker-mode duplication across processes is tolerated by the spec (the
 * accept asserts presence, not count — pinning a count would freeze worker
 * scheduling).
 */
import type { ConfigSnapshot } from '@detox-remote/protocol';

export interface FateWarning {
  key: string;
  message: string;
}

/** `testRunner.jest.*` keys with a recorded fate; everything else there is unknown. */
const TEST_RUNNER_JEST_FATES: Readonly<Record<string, string>> = {
  setupTimeout:
    'was a patience clock on an observable counterpart and is gone — ' +
    "jest's own testTimeout is the only test clock now",
  teardownTimeout:
    'was a patience clock on an observable counterpart and is gone — ' +
    "jest's own testTimeout is the only test clock now",
  reportSpecs: 'has no effect at alpha; heir: the reporting era',
  reportWorkerAssign: 'has no effect at alpha; heir: the reporting era',
  retries:
    "has no effect at alpha (jest's own `jest.retryTimes` in a test file keeps working — " +
    'circus owns retries); heir: the reporting/artifacts era',
};

/** Collects this snapshot's warnings; the caller owns once-per-process bookkeeping. */
export function collectFateWarnings(snapshot: ConfigSnapshot): FateWarning[] {
  const warnings: FateWarning[] = [];
  const warn = (key: string, message: string): void => {
    warnings.push({ key, message: `detox: ${key}: ${message}` });
  };

  const behavior = asRecord(snapshot.behavior);
  const behaviorInit = asRecord(behavior?.init);
  if (behaviorInit?.reinstallApp !== undefined) {
    warn(
      'behavior.init.reinstallApp',
      'has no effect — v21 installs by content hash at init, so a re-install is already a ' +
        'no-op server-side; heir: the compat/behavior lane',
    );
  }
  if (behaviorInit?.launchApp !== undefined) {
    warn(
      'behavior.init.launchApp',
      "has no effect (v20's 'auto'/'manual' debug workflow); heir: the debugging lane",
    );
  }
  if (behavior?.launchApp !== undefined) {
    warn(
      'behavior.launchApp',
      "has no effect (v20's 'auto'/'manual' debug workflow); heir: the debugging lane",
    );
  }
  const behaviorCleanup = asRecord(behavior?.cleanup);
  if (behaviorCleanup?.shutdownDevice !== undefined) {
    warn(
      'behavior.cleanup.shutdownDevice',
      'has no effect — the server owns simulator lifecycle; heir: the ' +
        "device-lifecycle knobs reopen (spec 009's device-sibling note)",
    );
  }

  const testRunnerJest = asRecord(asRecord(snapshot.testRunner)?.jest);
  if (testRunnerJest !== undefined) {
    for (const key of Object.keys(testRunnerJest)) {
      const fate = TEST_RUNNER_JEST_FATES[key];
      warn(
        `testRunner.jest.${key}`,
        fate ?? 'is not a key this Detox version knows — it has no effect',
      );
    }
  }
  return warnings;
}

/** Emits each warning once per process; `seen` is module state, per-worker. */
const seen = new Set<string>();

export function emitFateWarnings(
  snapshot: ConfigSnapshot,
  log: (message: string) => void = (message) => console.warn(message),
): void {
  for (const { key, message } of collectFateWarnings(snapshot)) {
    if (seen.has(key)) continue;
    seen.add(key);
    log(message);
  }
}

/** Test-only reset of the once-per-process bookkeeping. @internal */
export function resetFateWarningsForTest(): void {
  seen.clear();
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
