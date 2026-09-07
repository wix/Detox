/**
 * The reader (spec 009): a function taking
 * `{cwd, env, flags, signal}` with no module-level cache — a memoized
 * resolver would be an implicit singleton, which this codebase forbids. Its
 * one consumer is the `detox` bin; `specs/**` may never import it (the
 * accept file spawns the built binary), and `packages/server` may never
 * depend on it (cycle).
 *
 * AbortSignal (spec 009): the signal is consulted between steps — a hung
 * `require` of a `.detoxrc.js` is not interruptible, because `require` is
 * synchronous; the guarantee is prompt refusal at the next step boundary,
 * not a mid-load abort.
 */
import { discoverConfig } from './discover';
import { selectConfigurationName } from './select';
import { composeRun, resolveServerSection, type ComposedRun, type ServerSection } from './compose';

export interface ResolveFlags {
  /** `-c/--configuration` (beats DETOX_CONFIGURATION). */
  configuration?: string;
  /** `-C/--config-path` (beats DETOX_CONFIG_PATH). */
  configPath?: string;
}

export interface ResolveInput {
  cwd: string;
  env: Readonly<Record<string, string | undefined>>;
  flags: ResolveFlags;
  signal?: AbortSignal;
}

export interface ResolvedRun extends ComposedRun {
  configPath: string;
  configurationName: string;
}

export async function resolveRun({ cwd, env, flags, signal }: ResolveInput): Promise<ResolvedRun> {
  // @issue DTX-5006: yields once first so an already-aborted signal rejects, never throws synchronously.
  await Promise.resolve();
  signal?.throwIfAborted();
  const override = flags.configPath ?? (env.DETOX_CONFIG_PATH || undefined);
  const { configPath, config } = discoverConfig({ cwd, override });
  signal?.throwIfAborted();
  const configurationName = selectConfigurationName({
    config,
    configPath,
    flag: flags.configuration,
    env: env.DETOX_CONFIGURATION,
  });
  signal?.throwIfAborted();
  const composed = composeRun({ config, configPath, configurationName, cwd, env });
  signal?.throwIfAborted();
  return { ...composed, configPath, configurationName };
}

export interface ResolvedServing {
  /** Absent when no config file exists anywhere — flags and defaults govern. */
  configPath?: string;
  serverSection?: ServerSection;
}

/**
 * The serving verbs' half-resolution: they require only what they consume —
 * the `server` section (top-level, or the selected configuration's,
 * replacing it wholesale) — and run happily from a config file with no
 * `configurations` key, or from no config file at all.
 */
export async function resolveServing({ cwd, env, flags, signal }: ResolveInput): Promise<ResolvedServing> {
  // @issue DTX-5006: same uniform-rejection yield as resolveRun's.
  await Promise.resolve();
  signal?.throwIfAborted();
  const override = flags.configPath ?? (env.DETOX_CONFIG_PATH || undefined);
  let discovered;
  try {
    discovered = discoverConfig({ cwd, override });
  } catch (err) {
    // @issue DTX-5007: no config anywhere is fine for a serving verb; a bad explicit override (-C/env) still refuses.
    if (override !== undefined) throw err;
    return {};
  }
  signal?.throwIfAborted();
  const { configPath, config } = discovered;
  // @issue DTX-5008: serving verbs honor `detox test`'s selector precedence — -c flag, then DETOX_CONFIGURATION.
  const envSelector = env.DETOX_CONFIGURATION || undefined;
  const configurationName =
    flags.configuration !== undefined || envSelector !== undefined
      ? selectConfigurationName({ config, configPath, flag: flags.configuration, env: envSelector })
      : undefined;
  const serverSection = resolveServerSection(config, configPath, configurationName);
  signal?.throwIfAborted();
  return { configPath, serverSection };
}
