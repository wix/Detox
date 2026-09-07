/**
 * One place a setting's flag, env var and config-file key are declared —
 * `resolveSection`, `configShape` and `toChildArgs` all read the same
 * array, so the three cannot drift out of sync with each other.
 */
import { z, ZodError } from 'zod';

export interface SettingDescriptor<T = unknown> {
  key: string;
  schema: z.ZodType<T>;
  flag?: string;
  env?: string;
  /** No flag, env only, hidden from `--help` and the config schema — a
   *  deployment/test seam, never a project setting (e.g. `blobRoot`). */
  internal?: boolean;
  /** Has a flag/env and stays in `--help`, but no config-file key: either
   *  the setting makes no sense in a file, or its file shape genuinely
   *  differs (`token` here is flat; `auth` in the file is `{type, token}`,
   *  hand-declared separately). */
  noConfigKey?: boolean;
  /** A declared-but-empty env var is refused instead of treated as unset —
   *  for anything where "looks unset" would silently defeat a security
   *  check (an empty `DETOX_SERVER_TOKEN=` must not mean "auth off"). */
  strictEnv?: boolean;
  help?: string;
}

function getFlag(argv: readonly string[], flag: string): string | undefined {
  const i = argv.indexOf(flag);
  if (i === -1) return undefined;
  const value = argv[i + 1];
  if (value === undefined || value.startsWith('-')) {
    throw new SettingsError({ message: `Missing value for ${flag}`, key: undefined, reason: 'missing value' });
  }
  return value;
}

interface SettingsErrorDetails {
  message: string;
  key: string | undefined;
  reason: string;
}

export class SettingsError extends Error {
  /** Lets a caller build its own qualified path (`client.${err.key}`)
   *  instead of the flag/env name `.message` names by default. */
  readonly key?: string;
  readonly reason: string;

  constructor(details: SettingsErrorDetails) {
    super(details.message);
    this.key = details.key;
    this.reason = details.reason;
  }
}

interface PickedRaw {
  value: unknown;
  source: string;
}

/** Flag > non-empty env > config, `||` not `??` — a declared-but-empty env
 *  var is absent, not a configuration, unless the descriptor is `strictEnv`. */
function pickRaw(descriptor: SettingDescriptor, { argv, env, config }: ResolveInput): PickedRaw {
  if (descriptor.flag !== undefined) {
    const fromFlag = getFlag(argv, descriptor.flag);
    if (fromFlag !== undefined) return { value: fromFlag, source: descriptor.flag };
  }
  if (descriptor.env !== undefined) {
    const fromEnv = env[descriptor.env];
    if (fromEnv || (descriptor.strictEnv && fromEnv !== undefined)) {
      return { value: fromEnv, source: descriptor.env };
    }
  }
  return { value: config?.[descriptor.key], source: descriptor.key };
}

export interface ResolveInput {
  argv: readonly string[];
  env: Readonly<Record<string, string | undefined>>;
  config?: Readonly<Record<string, unknown>>;
}

/** The resolved shape of a descriptor array, inferred from the array's own
 *  elements rather than hand-declared — a new descriptor's field appears
 *  here automatically. */
export type InferSection<D extends readonly SettingDescriptor[]> = {
  [K in D[number] as K['key']]?: K extends SettingDescriptor<infer T> ? T : never;
};

export function resolveSection<const D extends readonly SettingDescriptor[]>(
  descriptors: D,
  input: ResolveInput,
): InferSection<D> {
  // Starts from `config` itself — an unrecognized key must still reach
  // `z.strictObject` and be refused; building `raw` by descriptor lookup
  // alone would silently drop it.
  const raw: Record<string, unknown> = { ...input.config };
  const sources: Record<string, string> = {};
  for (const descriptor of descriptors) {
    const picked = pickRaw(descriptor, input);
    if (picked.value !== undefined) {
      raw[descriptor.key] = picked.value;
      sources[descriptor.key] = picked.source;
    }
  }
  const shape = Object.fromEntries(descriptors.map((d) => [d.key, d.schema.optional()]));
  try {
    return z.strictObject(shape).parse(raw) as InferSection<D>;
  } catch (err) {
    if (err instanceof ZodError) {
      const issue = err.issues[0];
      if (issue?.code === 'unrecognized_keys') {
        const [name] = issue.keys;
        const reason = `Unrecognized key: "${name}"`;
        throw new SettingsError({ message: reason, key: undefined, reason });
      }
      const key = String(issue?.path[0] ?? '');
      const reason = issue?.message ?? 'invalid value';
      const name = sources[key] ?? key;
      throw new SettingsError({ message: `Invalid ${name}: ${reason}`, key, reason });
    }
    throw err;
  }
}

/** The config-file shape for a section, as a raw `ZodRawShape` rather than
 *  a wrapped schema, so a caller with fields whose file shape differs from
 *  their flag/env shape can `z.strictObject({...configShape(X), auth: ...})`. */
export function configShape<const D extends readonly SettingDescriptor[]>(
  descriptors: D,
): { [K in keyof InferSection<D>]: z.ZodOptional<z.ZodType<InferSection<D>[K]>> } {
  const shape = Object.fromEntries(
    descriptors.filter((d) => !d.internal && !d.noConfigKey).map((d) => [d.key, d.schema.optional()]),
  );
  return shape as { [K in keyof InferSection<D>]: z.ZodOptional<z.ZodType<InferSection<D>[K]>> };
}

/** Re-serializes a resolved config section as argv for a spawned child.
 *  Skipped when the child's own env mirror already covers a value — a
 *  secret should reach the child by env, not argv, since `ps` makes argv
 *  visible to every process on the machine. */
export function toChildArgs(
  descriptors: readonly SettingDescriptor[],
  section: Readonly<Record<string, unknown>> | undefined,
  userArgv: readonly string[],
  env: Readonly<Record<string, string | undefined>> = {},
): string[] {
  const merged = [...userArgv];
  if (section === undefined) return merged;
  const has = (flag: string): boolean => merged.includes(flag);
  for (const descriptor of descriptors) {
    if (descriptor.flag === undefined || has(descriptor.flag)) continue;
    if (descriptor.env !== undefined && env[descriptor.env] !== undefined) continue;
    const value = section[descriptor.key];
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') continue;
    merged.push(descriptor.flag, String(value));
  }
  return merged;
}

export function helpLines(descriptors: readonly SettingDescriptor[]): string {
  return descriptors
    .filter((d) => !d.internal && d.flag !== undefined && d.help !== undefined)
    .map((d) => {
      const envNote = d.env !== undefined ? ` (env ${d.env})` : '';
      return `  ${d.flag} — ${d.help}${envNote}`;
    })
    .join('\n');
}
