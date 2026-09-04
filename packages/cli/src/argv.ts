/**
 * The CLI's argv conduct (spec 009). `detox test` consumes
 * exactly two flags — `-c/--configuration`, `-C/--config-path` — and
 * forwards every other token to the runner verbatim, in the user's own
 * order: pass-through is a feature, stated in --help. The serving verbs and
 * `build` refuse unknown flags instead (a token bound for nobody is a typo,
 * and there is no runner behind them to hand it to).
 *
 * The spawn contract (port of v20 `TestRunnerCommand.js`, reduced): `$0`
 * split on whitespace is the command; the remaining `args` render as
 * `--key value` pairs (boolean true → bare `--key`), `_` positionals last
 * of the configured group; forwarded tokens after them.
 */
import path from 'node:path';

import { toChildArgs } from '@detox-remote/core';
import { SERVER_SETTINGS } from '@detox-remote/server';
import { RELAY_SETTINGS } from 'detox-relay';

import { UsageError } from './errors';
import type { ServerSection } from './compose';

export interface SplitArgv {
  configuration?: string;
  configPath?: string;
  /** Everything that is not ours, verbatim, in the user's order. */
  forwarded: string[];
}

const CONFIGURATION_FLAGS = new Set(['-c', '--configuration']);
const CONFIG_PATH_FLAGS = new Set(['-C', '--config-path']);

export function splitCliArgv(argv: readonly string[]): SplitArgv {
  const forwarded: string[] = [];
  let configuration: string | undefined;
  let configPath: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (CONFIGURATION_FLAGS.has(token) || CONFIG_PATH_FLAGS.has(token)) {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('-')) {
        throw new UsageError(`Missing value for ${token}`);
      }
      if (CONFIGURATION_FLAGS.has(token)) configuration = value;
      else configPath = value;
      i++;
      continue;
    }
    forwarded.push(token);
  }
  return { configuration, configPath, forwarded };
}

/** The verbs that own their whole flag surface refuse a stranger by name. */
export function refuseUnknownFlags(
  verb: string,
  tokens: readonly string[],
  known: ReadonlySet<string>,
): void {
  for (const token of tokens) {
    if (token.startsWith('-') && !known.has(token)) {
      throw new UsageError(
        `Unknown flag for \`detox ${verb}\`: ${token} (run \`detox ${verb} --help\`)`,
      );
    }
  }
}

export interface RunnerInvocation {
  command: string;
  argv: string[];
}

export function buildRunnerInvocation(
  runnerArgs: Readonly<Record<string, unknown>>,
  forwarded: readonly string[],
): RunnerInvocation {
  // @issue DTX-5009: multi-word `$0` ('nyc jest') splits on whitespace — first token is the command.
  // A path with spaces in $0 is unsupported at alpha.
  const words = String(runnerArgs.$0).split(/\s+/).filter((word) => word.length > 0);
  const [command, ...leading] = words;
  const argv = [...leading];
  for (const [key, value] of Object.entries(runnerArgs)) {
    if (key === '$0' || key === '_') continue;
    if (value === undefined || value === false) continue;
    if (value === true) {
      argv.push(`--${key}`);
      continue;
    }
    argv.push(`--${key}`, renderTokenValue(value));
  }
  const positionals = runnerArgs._;
  if (Array.isArray(positionals)) {
    argv.push(...positionals.map(String));
  }
  argv.push(...forwarded);
  return { command, argv };
}

/** @issue DTX-5010: a non-scalar value renders as one lossless JSON token — no sane single-token rendering exists. */
function renderTokenValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return JSON.stringify(value) ?? '';
}

export interface RunnerEnvInput {
  base: Readonly<Record<string, string | undefined>>;
  snapshotPath: string;
  configurationName: string;
  cwd: string;
}

/** @issue DTX-5011: sets the snapshot path, resolved DETOX_CONFIGURATION, and PATH's node_modules/.bin prefix. */
export function buildRunnerEnv({ base, snapshotPath, configurationName, cwd }: RunnerEnvInput): Record<string, string | undefined> {
  const binDir = path.join(cwd, 'node_modules', '.bin');
  const basePath = base.PATH ?? '';
  return {
    ...base,
    DETOX_CONFIG_SNAPSHOT_PATH: snapshotPath,
    DETOX_CONFIGURATION: configurationName,
    PATH: basePath === '' ? binDir : `${binDir}${path.delimiter}${basePath}`,
  };
}

/**
 * @issue DTX-5012: appends after the user's argv, suppressed by a set env mirror (flag > env > config).
 * In-process argv, not `ps`-visible. `detox relay` hands `server.nodes` to
 * its main in process, so node tokens touch no file or argv either.
 *
 * `--token` is forwarded by hand below, not by `toChildArgs`: the config's
 * shape for it is the nested `server.auth.token`, not a flat `section.token`.
 */
export function serverSectionToArgs(
  section: ServerSection | undefined,
  userArgv: readonly string[],
  verb: 'server' | 'relay',
  env: Readonly<Record<string, string | undefined>> = {},
): string[] {
  const descriptors = verb === 'server' ? SERVER_SETTINGS : RELAY_SETTINGS;
  const merged = toChildArgs(descriptors, section, userArgv, env);
  const tokenMirror = verb === 'server' ? 'DETOX_SERVER_TOKEN' : 'DETOX_RELAY_TOKEN';
  if (section?.auth?.token !== undefined && !merged.includes('--token') && env[tokenMirror] === undefined) {
    merged.push('--token', section.auth.token);
  }
  return merged;
}

/** `detox build`'s inputs: the selected apps' build strings, in config order. */
export function collectBuildCommands(
  apps: ReadonlyArray<Record<string, unknown>>,
  configPath: string,
): string[] {
  const commands = apps
    .map((app) => app.build)
    .filter((build): build is string => typeof build === 'string' && build.length > 0);
  if (commands.length === 0) {
    throw new UsageError(
      `${configPath}: no app in the selected configuration has a \`build\` command — add one to use \`detox build\` (v20 missingBuildScript, kept)`,
    );
  }
  return commands;
}
