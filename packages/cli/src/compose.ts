/**
 * Config composition — the fate tables of spec 009 rendered executable.
 * Ports v20's `composeAppsConfig.js` / `composeDeviceConfig.js` /
 * `composeRunnerConfig.js`; `composeSessionConfig.js` has no counterpart —
 * its subject, the `session` block, is a refusal now.
 *
 * The schema is zod: consumed structures are
 * `z.strictObject`s, so an unknown key inside them is a message naming the
 * file and key path, never silence. The strict/forward line is drawn by
 * consequence: strict wherever a lost key would change which server, device
 * or app the user gets (`client`, `server`, the device matcher, a
 * configuration entry); forwarding wherever the vocabulary belongs to an
 * heir (top-level unknowns, app-level extras, `artifacts`, `behavior`,
 * `testRunner.jest`).
 */
import path from 'node:path';

import { z, ZodError } from 'zod';
import type { ConfigSnapshot, ConfigSnapshotApp, ConfigSnapshotQuery } from '@detox-remote/protocol';

import { configError } from './errors';

const WS_URL = z
  .string()
  .regex(/^wss?:\/\//i, 'must be a ws:// or wss:// URL');

const clientSchema = z.strictObject({
  server: WS_URL.optional(),
  token: z.string().min(1).optional(),
  // @issue DTX-5014: `false`/absence is the only truthful autostart value; `true` refuses.
  autostart: z.boolean().optional(),
});

const authSchema = z.strictObject({
  type: z.literal('static-token'),
  token: z.string().min(1),
});

const nodeSchema = z.strictObject({
  name: z.string().min(1),
  url: WS_URL,
  // A tokenless node runs with auth off.
  token: z.string().min(1).optional(),
});

const serverSectionSchema = z.strictObject({
  host: z.string().min(1).optional(),
  port: z.number().int().min(0).max(65_535).optional(),
  auth: authSchema.optional(),
  maxPool: z.number().int().min(0).optional(),
  blobBudget: z.number().positive().optional(),
  keepaliveWindow: z.number().min(0).optional(),
  nodes: z.array(nodeSchema).optional(),
});

export type ServerSection = z.infer<typeof serverSectionSchema>;
export type RosterNode = NonNullable<ServerSection['nodes']>[number];

const configurationEntrySchema = z.strictObject({
  device: z.union([z.string().min(1), z.record(z.string(), z.unknown())]).optional(),
  app: z.union([z.string().min(1), z.record(z.string(), z.unknown())]).optional(),
  apps: z.array(z.union([z.string().min(1), z.record(z.string(), z.unknown())])).optional(),
  server: serverSectionSchema.optional(),
  // @issue DTX-5016: configuration-scoped artifacts/behavior forward, winning over the top-level value.
  artifacts: z.unknown().optional(),
  behavior: z.unknown().optional(),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Wraps a zod refusal into the CLI's message shape: file, key path, reason. */
function parseStrict<T>(
  schema: z.ZodType<T>,
  value: unknown,
  configPath: string,
  keyPathPrefix: string,
): T {
  try {
    return schema.parse(value);
  } catch (err) {
    if (err instanceof ZodError) {
      const issue = err.issues[0];
      const keyPath = [keyPathPrefix, ...(issue?.path ?? []).map(String)]
        .filter((part) => part !== '')
        .join('.');
      throw configError(configPath, keyPath, issue?.message ?? 'invalid value');
    }
    throw err;
  }
}

/**
 * The refusals that fire before anything composes: legacy keys are
 * signposts, never adapters.
 */
export function refuseLegacyKeys(config: Record<string, unknown>, configPath: string): void {
  const scopes: ReadonlyArray<readonly [Record<string, unknown>, string]> = [
    [config, ''] as const,
    ...(isRecord(config.configurations)
      ? Object.entries(config.configurations)
          .filter((entry): entry is [string, Record<string, unknown>] => isRecord(entry[1]))
          .map(([name, entry]) => [entry, `configurations.${name}.`] as const)
      : []),
  ];
  // @issue DTX-5015: the `session` signpost fires wherever the key appears, including inside a configuration entry.
  for (const [scope, prefix] of scopes) {
    if ('session' in scope) {
      throw configError(
        configPath,
        `${prefix}session`,
        'this is v20\'s spelling and gets no adapter in v21 — rename it: `client: { server, token }` says which server this project dials (omit `client.server` and `detox test` starts a run-scoped server, replacing `autoStart`); a `server` section configures what `detox server`/`detox relay` start on this machine',
      );
    }
    if (typeof scope.testRunner === 'string') {
      throw configError(
        configPath,
        `${prefix}testRunner`,
        'a string testRunner is v19\'s spelling — make it an object: `testRunner: { args: { $0: "jest" } }` (see the Detox 20 migration guide)',
      );
    }
    for (const key of ['runnerConfig', 'specs'] as const) {
      if (key in scope) {
        throw configError(
          configPath,
          `${prefix}${key}`,
          'a v19-era key with no v21 meaning — move runner settings under `testRunner.args` (see the Detox 20 migration guide)',
        );
      }
    }
  }
}

/** Top-level keys the composer consumes — everything else forwards verbatim. */
const CONSUMED_TOP_LEVEL = new Set([
  'configurations',
  'selectedConfiguration',
  'extends',
  'client',
  'server',
  'apps',
  'devices',
  'testRunner',
]);

/** v20-consumed keys alpha does not honor: forwarded, warned once each. */
const WARNED_TOP_LEVEL: Readonly<Record<string, string>> = {
  logger: 'the logging lane',
};

const WARNED_TEST_RUNNER_KEYS: Readonly<Record<string, string>> = {
  retries: 'the reporting/artifacts era',
  bail: 'the reporting/artifacts era',
  detached: 'the reporting/artifacts era',
  forwardEnv: 'the reporting/artifacts era',
  inspectBrk: 'the debugging lane',
};

const WARNED_APP_KEYS: Readonly<Record<string, string>> = {
  start: 'the app-start-commands lane',
};

export interface ComposeInput {
  config: Record<string, unknown>;
  configPath: string;
  configurationName: string;
  /** The CLI's cwd — `binaryPath` resolves absolute against it. */
  cwd: string;
  env: Readonly<Record<string, string | undefined>>;
}

export interface ComposedRun {
  snapshot: ConfigSnapshot;
  /** The effective `server` section (configuration's replaces top-level wholesale). */
  serverSection?: ServerSection;
  /** Internal-only: `false` is the permanent local-helper opt-out. */
  clientAutostart?: boolean;
  /** `testRunner.args` with `$0` defaulted — the spawn contract's input. */
  runnerArgs: Record<string, unknown>;
  /** One line per key v20 consumed and alpha does not — printed once each. */
  warnings: string[];
}

function resolveAlias(
  ref: unknown,
  dictionary: unknown,
  configPath: string,
  keyPath: string,
  dictionaryName: string,
): Record<string, unknown> {
  if (isRecord(ref)) return ref;
  if (typeof ref !== 'string') {
    throw configError(configPath, keyPath, 'must be an alias string or an inline object');
  }
  if (!isRecord(dictionary) || !(ref in dictionary)) {
    const available = isRecord(dictionary) ? Object.keys(dictionary).join(', ') : '(none)';
    throw configError(
      configPath,
      keyPath,
      `no "${ref}" in the top-level ${dictionaryName} dictionary. Available: ${available}`,
    );
  }
  const value = dictionary[ref];
  if (!isRecord(value)) {
    throw configError(configPath, `${dictionaryName}.${ref}`, 'must be an object');
  }
  return value;
}

/** v20 `unpackDeviceQuery`'s string shorthand: 'iPhone 14' / 'iPhone 14, 16.0'. */
function queryFromShorthand(
  shorthand: string,
  configPath: string,
  keyPath: string,
): ConfigSnapshotQuery {
  const parts = shorthand.split(',').map((part) => part.trim());
  // @issue DTX-5017: >2 comma-separated parts refuses — dropping the tail would widen the match (#1).
  if (parts.length > 2) {
    throw configError(
      configPath,
      keyPath,
      `the shorthand is 'model' or 'model, os' — got ${String(parts.length)} comma-separated parts`,
    );
  }
  const [model, os] = parts;
  return os ? { model, os } : { model };
}

interface DeviceComposition {
  device: ConfigSnapshot['device'];
  warnings: string[];
}

function composeDevice(
  deviceConfig: Record<string, unknown>,
  configPath: string,
  keyPath: string,
): DeviceComposition {
  const type = deviceConfig.type;
  if (typeof type !== 'string' || type.length === 0) {
    throw configError(configPath, `${keyPath}.type`, 'the device needs a type');
  }
  if (type !== 'ios.simulator') {
    throw configError(
      configPath,
      `${keyPath}.type`,
      `"${type}" is not runnable on Detox 21 alpha 1 — this release is iOS-only (ios.simulator). The configuration may stay in the file; selecting it is what refuses`,
    );
  }
  const matcher = deviceConfig.device;
  let query: ConfigSnapshotQuery;
  if (typeof matcher === 'string') {
    query = queryFromShorthand(matcher, configPath, `${keyPath}.device`);
  } else if (isRecord(matcher)) {
    query = {};
    for (const [key, value] of Object.entries(matcher)) {
      // A dropped matcher key widens the match — an empty query may be
      // answered with anything.
      if (key === 'name') {
        throw configError(
          configPath,
          `${keyPath}.device.name`,
          'v21 does not match on simulator display names — use `type` (the model string) or `id` (the udid)',
        );
      }
      if (key !== 'type' && key !== 'os' && key !== 'id') {
        throw configError(
          configPath,
          `${keyPath}.device.${key}`,
          'not a v21 device matcher key — the query is `type` (model), `os`, `id` (udid)',
        );
      }
      if (typeof value !== 'string' && typeof value !== 'number') {
        throw configError(
          configPath,
          `${keyPath}.device.${key}`,
          'must be a string (a number is accepted and read as one)',
        );
      }
      const mapped = key === 'type' ? 'model' : key === 'id' ? 'deviceId' : 'os';
      query[mapped] = String(value);
    }
  } else if (matcher === undefined) {
    query = {};
  } else {
    throw configError(
      configPath,
      `${keyPath}.device`,
      'must be a matcher object or a shorthand string',
    );
  }

  const warnings: string[] = [];
  const device: ConfigSnapshot['device'] = { type, query };
  for (const [key, value] of Object.entries(deviceConfig)) {
    if (key === 'type' || key === 'device') continue;
    // @issue DTX-5018: device siblings that aren't the query forward into snapshot.device, warned once each.
    warnings.push(
      `${keyPath}.${key}: had an effect in Detox 20 and has none at alpha (the server owns simulator lifecycle); carried into the snapshot for its heir`,
    );
    device[key] = value;
  }
  return { device, warnings };
}

interface AppsComposition {
  apps: ConfigSnapshotApp[];
  warnings: string[];
}

function composeApps(
  entry: z.infer<typeof configurationEntrySchema>,
  config: Record<string, unknown>,
  configPath: string,
  configurationName: string,
  cwd: string,
): AppsComposition {
  const keyPathBase = `configurations.${configurationName}`;
  if (entry.app !== undefined && entry.apps !== undefined) {
    throw configError(
      configPath,
      keyPathBase,
      'use `app` or `apps`, not both (v20 rule, kept)',
    );
  }
  const refs = entry.apps ?? (entry.app !== undefined ? [entry.app] : []);
  if (refs.length === 0) {
    throw configError(
      configPath,
      keyPathBase,
      'the configuration resolves no app — add `app: <alias or inline>`',
    );
  }

  const warnings: string[] = [];
  const seenNames = new Set<string>();
  const apps = refs.map((ref, index) => {
    const keyPath = entry.apps !== undefined ? `${keyPathBase}.apps.${String(index)}` : `${keyPathBase}.app`;
    const appConfig = resolveAlias(ref, config.apps, configPath, keyPath, 'apps');
    const type = appConfig.type;
    if (typeof type !== 'string' || type.length === 0) {
      throw configError(configPath, `${keyPath}.type`, 'the app needs a type');
    }
    if (type !== 'ios.app') {
      throw configError(
        configPath,
        `${keyPath}.type`,
        `"${type}" is not runnable on Detox 21 alpha 1 — this release is iOS-only (ios.app)`,
      );
    }
    const name = typeof appConfig.name === 'string' && appConfig.name.length > 0 ? appConfig.name : 'default';
    if (seenNames.has(name)) {
      throw configError(
        configPath,
        keyPath,
        `two apps named "${name}" — names must be unique within a configuration (v20 rule, kept)`,
      );
    }
    seenNames.add(name);

    const bundleId = appConfig.bundleId;
    if (bundleId !== undefined && (typeof bundleId !== 'string' || bundleId.length === 0)) {
      throw configError(configPath, `${keyPath}.bundleId`, 'must be a non-empty string');
    }
    const binaryPath = appConfig.binaryPath;
    if (binaryPath !== undefined && (typeof binaryPath !== 'string' || binaryPath.length === 0)) {
      throw configError(configPath, `${keyPath}.binaryPath`, 'must be a non-empty string');
    }
    // @issue DTX-5019: `bundleId` is optional; with neither key present, compose refuses naming both.
    if (bundleId === undefined && binaryPath === undefined) {
      throw configError(
        configPath,
        keyPath,
        'the app has neither `bundleId` nor `binaryPath` — add a `binaryPath` (the bundle id is derived from the app at init) or a `bundleId`',
      );
    }

    const app: ConfigSnapshotApp = { name };
    for (const [key, value] of Object.entries(appConfig)) {
      if (key === 'name' || key === 'binaryPath') continue;
      if (key in WARNED_APP_KEYS) {
        warnings.push(
          `${keyPath}.${key}: had an effect in Detox 20 and has none at alpha; carried into the snapshot for its heir (${WARNED_APP_KEYS[key]})`,
        );
      }
      // @issue DTX-5020: every other app key forwards into the snapshot verbatim for compat/heir specs to consume.
      app[key] = value;
    }
    if (binaryPath !== undefined) {
      // @issue DTX-5021: `binaryPath` resolves absolute against the CLI's cwd (v20's base).
      // Existence is not preflighted — the derivation's or install's own error names the path.
      app.binaryPath = path.resolve(cwd, binaryPath);
    }
    return app;
  });
  return { apps, warnings };
}

/** @issue DTX-5022: a configuration's `server` section replaces the top-level one wholesale, never merged. */
export function resolveServerSection(
  config: Record<string, unknown>,
  configPath: string,
  configurationName?: string,
): ServerSection | undefined {
  let section: ServerSection | undefined;
  if (config.server !== undefined) {
    section = parseStrict(serverSectionSchema, config.server, configPath, 'server');
  }
  if (configurationName !== undefined && isRecord(config.configurations)) {
    const entryRaw = config.configurations[configurationName];
    if (isRecord(entryRaw) && entryRaw.server !== undefined) {
      section = parseStrict(
        serverSectionSchema,
        entryRaw.server,
        configPath,
        `configurations.${configurationName}.server`,
      );
    }
  }
  return section;
}

export function composeRun({ config, configPath, configurationName, cwd, env }: ComposeInput): ComposedRun {
  refuseLegacyKeys(config, configPath);

  const warnings: string[] = [];

  const client =
    config.client === undefined
      ? {}
      : parseStrict(clientSchema, config.client, configPath, 'client');
  if (client.autostart === true) {
    throw configError(
      configPath,
      'client.autostart',
      '`true` is not a supported spelling — omit `client.autostart` to use the detached ' +
        'local helper, set `client.autostart: false` to opt out and require an explicit server',
    );
  }
  // @issue DTX-5023: DETOX_SESSION_TOKEN overrides client.token when set; an empty env string counts as unset.
  const envToken = env.DETOX_SESSION_TOKEN || undefined;
  const token = envToken ?? client.token;

  const serverSection = resolveServerSection(config, configPath, configurationName);

  const entryRaw = isRecord(config.configurations)
    ? config.configurations[configurationName]
    : undefined;
  const entry = parseStrict(
    configurationEntrySchema,
    entryRaw,
    configPath,
    `configurations.${configurationName}`,
  );

  // @issue DTX-5024: device composes and refuses before the app — the order spec 009 pins.
  if (entry.device === undefined) {
    throw configError(
      configPath,
      `configurations.${configurationName}`,
      'the configuration resolves no device — add `device: <alias or inline>`',
    );
  }
  const deviceConfig = resolveAlias(
    entry.device,
    config.devices,
    configPath,
    `configurations.${configurationName}.device`,
    'devices',
  );
  const { device, warnings: deviceWarnings } = composeDevice(
    deviceConfig,
    configPath,
    `configurations.${configurationName}.device`,
  );
  warnings.push(...deviceWarnings);

  const { apps, warnings: appWarnings } = composeApps(entry, config, configPath, configurationName, cwd);
  warnings.push(...appWarnings);

  // testRunner: `args` is the spawn contract (consumed); `jest` is 010's
  // vocabulary (forwarded, unwarned); the five v20 knobs alpha ignores are
  // forwarded, warned once each; the whole object rides into the snapshot
  // verbatim so nothing is dropped.
  const testRunner = config.testRunner;
  if (testRunner !== undefined && !isRecord(testRunner)) {
    throw configError(configPath, 'testRunner', 'must be an object');
  }
  const argsRaw = testRunner?.args;
  if (argsRaw !== undefined && !isRecord(argsRaw)) {
    throw configError(configPath, 'testRunner.args', 'must be an object');
  }
  const runnerArgs: Record<string, unknown> = { $0: 'jest', ...(argsRaw ?? {}) };
  if (typeof runnerArgs.$0 !== 'string' || runnerArgs.$0.trim().length === 0) {
    throw configError(configPath, 'testRunner.args.$0', 'must be a non-empty command string');
  }
  if (testRunner !== undefined) {
    for (const key of Object.keys(testRunner)) {
      if (key in WARNED_TEST_RUNNER_KEYS) {
        warnings.push(
          `testRunner.${key}: had an effect in Detox 20 and has none at alpha; carried into the snapshot for its heir (${WARNED_TEST_RUNNER_KEYS[key]})`,
        );
      }
    }
  }

  const snapshot: ConfigSnapshot = {
    configurationName,
    // `server` is filled by the run-scoped path when absent — `detox test`
    // never writes a snapshot without one.
    client: {
      ...(client.server !== undefined ? { server: client.server } : {}),
      ...(token !== undefined ? { token } : {}),
    } as ConfigSnapshot['client'],
    apps,
    device,
  };
  if (testRunner !== undefined) snapshot.testRunner = testRunner;

  // Forwarded top-level keys ride into the snapshot verbatim — future specs
  // read the snapshot, not the file, so a new consumer never changes the
  // format. Keys v20 consumed and alpha does not (`logger`) additionally
  // warn, once.
  // @issue DTX-5025: a forwarded key that would clobber a composed snapshot field refuses, never silently (#1).
  for (const [key, value] of Object.entries(config)) {
    if (CONSUMED_TOP_LEVEL.has(key)) continue;
    if (key === 'device' || key === 'app' || key === 'configurationName') {
      throw configError(
        configPath,
        key,
        key === 'configurationName'
          ? 'not a config key — to preselect a configuration use `selectedConfiguration`'
          : `a top-level \`${key}\` has no meaning — use the \`${key}s\` dictionary plus a \`configurations\` entry`,
      );
    }
    if (key in WARNED_TOP_LEVEL) {
      warnings.push(
        `${key}: had an effect in Detox 20 and has none at alpha; carried into the snapshot for its heir (${WARNED_TOP_LEVEL[key]})`,
      );
    }
    snapshot[key] = value;
  }

  // @issue DTX-5016: same forwarded, configuration-wins fate for artifacts/behavior.
  if (entry.artifacts !== undefined) snapshot.artifacts = entry.artifacts;
  if (entry.behavior !== undefined) snapshot.behavior = entry.behavior;

  return { snapshot, serverSection, clientAutostart: client.autostart, runnerArgs, warnings };
}
