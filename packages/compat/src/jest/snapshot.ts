/**
 * The 009↔010 seam, runner side (spec 010's "Setup, first file" contract):
 * read the snapshot file `detox test` wrote, map it exactly as spec 009's
 * binding section records — `client.server` + `client.token` → `server.url` +
 * bearer header (no header when no token); `apps` verbatim;
 * `device.query` → `device` — and hand compat's `init` its config. This
 * module re-resolves nothing: the CLI resolved once, `JSON.parse` is the
 * whole config job here.
 */
import { readFileSync } from 'node:fs';

import type { ConfigSnapshot } from '@detox-remote/protocol';
import { DetoxError, DetoxErrorCode } from 'detox/internals';

import type { CompatConfig } from '../index';

/** The one behavior key 010 consumes (its fate table); the rest warn once. */
export interface RunnerBehavior {
  exposeGlobals: boolean;
}

export interface LoadedSnapshot {
  snapshot: ConfigSnapshot;
  compatConfig: CompatConfig;
  behavior: RunnerBehavior;
}

const refusal = (message: string): DetoxError =>
  new DetoxError(message, {
    code: DetoxErrorCode.DETOX_NOT_INITIALIZED,
    details: { method: 'detox/runners/jest/testEnvironment' },
  });

/**
 * Reads and maps the snapshot named by `DETOX_CONFIG_SNAPSHOT_PATH`. Absence
 * is a typed, instructive refusal naming `detox test` — the environment is
 * not runnable against a bare `jest` call, and says so instead of NPEing.
 */
export function loadSnapshot(env: Readonly<Record<string, string | undefined>>): LoadedSnapshot {
  const snapshotPath = env.DETOX_CONFIG_SNAPSHOT_PATH;
  if (snapshotPath === undefined || snapshotPath === '') {
    throw refusal(
      'the Detox jest environment found no DETOX_CONFIG_SNAPSHOT_PATH in its environment — ' +
        'run your suite through `detox test -c <configuration>` (a bare `jest` call has no ' +
        'resolved Detox config to run against)',
    );
  }
  let raw: string;
  try {
    raw = readFileSync(snapshotPath, 'utf8');
  } catch (cause) {
    throw new DetoxError(
      `the Detox config snapshot at ${snapshotPath} could not be read — was the \`detox test\` ` +
        'process that wrote it interrupted? Re-run through `detox test -c <configuration>`',
      {
        code: DetoxErrorCode.DETOX_NOT_INITIALIZED,
        details: { method: 'detox/runners/jest/testEnvironment', snapshotPath },
        cause,
      },
    );
  }
  let snapshot: ConfigSnapshot;
  try {
    snapshot = JSON.parse(raw) as ConfigSnapshot;
  } catch (cause) {
    throw new DetoxError(
      `the Detox config snapshot at ${snapshotPath} is not valid JSON — it is written by ` +
        '`detox test` and is not meant to be edited',
      {
        code: DetoxErrorCode.DETOX_NOT_INITIALIZED,
        details: { method: 'detox/runners/jest/testEnvironment', snapshotPath },
        cause,
      },
    );
  }
  return {
    snapshot,
    compatConfig: mapSnapshot(snapshot),
    behavior: behaviorOf(snapshot),
  };
}

/** The recorded 009 mapping, field by field — the probe runner's own reference shape. */
export function mapSnapshot(snapshot: ConfigSnapshot): CompatConfig {
  const client = snapshot.client;
  if (typeof client?.server !== 'string' || client.server === '') {
    throw refusal(
      'the Detox config snapshot carries no client.server — `detox test` always writes one, ' +
        'so this snapshot did not come from `detox test`',
    );
  }
  return {
    server: {
      url: client.server,
      // No header when no token — auth is opt-in and off by default.
      ...(client.token !== undefined
        ? { headers: { Authorization: `Bearer ${client.token}` } }
        : {}),
    },
    // Verbatim: the snapshot app shape is the compat app shape (name,
    // bundleId?, binaryPath?, launchArgs? all ride through).
    apps: (snapshot.apps ?? []),
    ...(snapshot.device?.query !== undefined ? { device: snapshot.device.query } : {}),
  };
}

function behaviorOf(snapshot: ConfigSnapshot): RunnerBehavior {
  const behavior = snapshot.behavior as
    | { init?: { exposeGlobals?: unknown } }
    | undefined;
  return {
    // Default `true` (the spec's fate table): only an explicit `false` hides
    // the globals; anything else — absent, truthy, malformed — exposes.
    exposeGlobals: behavior?.init?.exposeGlobals !== false,
  };
}
