/**
 * Config file discovery and loading (spec 009; port of v20
 * `loadExternalConfig.js`). The monorepo order is pinned: walk up from the
 * CLI's cwd, in each directory try all eight filenames in v20's order, and
 * the first existing candidate wins — the nearest directory beats filename
 * precedence. A `package.json` counts only when it carries a `detox` key
 * (else the walk continues).
 *
 * `extends` merges deep, base under, self over, recursively; a cycle is a
 * refusal (v20 had no guard; v21 adds one rather than a stack overflow).
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { configError } from './errors';

export const CONFIG_FILENAMES = [
  '.detoxrc.cjs',
  '.detoxrc.js',
  '.detoxrc.json',
  '.detoxrc',
  'detox.config.cjs',
  'detox.config.js',
  'detox.config.json',
  'package.json',
] as const;

export interface DiscoveredConfig {
  /** Absolute path of the file the config came from — every refusal names it. */
  readonly configPath: string;
  /** The config object, `extends` already folded in. */
  readonly config: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Loads one config file by its own extension. `.js`/`.cjs` go through
 * `require` (the config forms that are code); `.json`, extensionless
 * `.detoxrc`, and everything else parse as JSON; `package.json` contributes
 * its `detox` key.
 */
export function loadConfigFile(absPath: string): Record<string, unknown> {
  let value: unknown;
  if (absPath.endsWith('.js') || absPath.endsWith('.cjs')) {
    const requireFrom = createRequire(absPath);
    try {
      value = requireFrom(absPath);
    } catch (err) {
      // A code config that throws must refuse in the same file-naming shape
      // as a malformed JSON one — not escape as a raw require error.
      throw configError(
        absPath,
        '',
        `the config file threw while loading: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  } else {
    let text: string;
    try {
      text = readFileSync(absPath, 'utf8');
    } catch (err) {
      throw configError(absPath, '', `could not read the config file: ${err instanceof Error ? err.message : String(err)}`);
    }
    try {
      value = JSON.parse(text);
    } catch (err) {
      throw configError(absPath, '', `not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (path.basename(absPath) === 'package.json') {
      value = isRecord(value) ? value.detox : undefined;
      if (value === undefined) {
        throw configError(absPath, 'detox', 'this package.json has no "detox" key');
      }
    }
  }
  if (!isRecord(value)) {
    throw configError(absPath, '', 'the config must be an object');
  }
  return value;
}

/** The upward walk. Returns undefined when nothing anywhere qualifies. */
export function findConfigFile(cwd: string): string | undefined {
  let dir = path.resolve(cwd);
  for (;;) {
    for (const name of CONFIG_FILENAMES) {
      const candidate = path.join(dir, name);
      if (!existsSync(candidate)) continue;
      if (name === 'package.json') {
        // @issue DTX-5002: package.json counts only when it has a "detox" key — v20 (cosmiconfig) semantics, kept.
        try {
          const pkg: unknown = JSON.parse(readFileSync(candidate, 'utf8'));
          if (isRecord(pkg) && pkg.detox !== undefined) return candidate;
        } catch {
          // @issue DTX-5003: an unparseable package.json is skipped, not a refusal — the walk continues.
        }
        continue;
      }
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/**
 * @issue DTX-5004: `-C`/`DETOX_CONFIG_PATH` tries node `require` resolution first, then a plain existing path.
 * v20's "legacy filesystem resolution" warning dance is not replicated (spec 009).
 */
export function resolveConfigOverride(override: string, cwd: string): string {
  const requireFrom = createRequire(path.join(cwd, 'noop.js'));
  try {
    return requireFrom.resolve(override);
  } catch {
    const plain = path.resolve(cwd, override);
    if (existsSync(plain)) return plain;
    throw configError(
      override,
      '',
      'no config file here — neither require-resolvable nor an existing path',
    );
  }
}

/**
 * @issue DTX-5005: deep merge, base under self over — v20 `tryExtendConfig` (lodash `merge`) semantics.
 * Plain objects merge recursively; arrays merge element-wise by index; an
 * `undefined` on the overriding side leaves the base value in place.
 */
export function deepMerge(
  base: Record<string, unknown>,
  self: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(self)) {
    out[key] = mergeValue(out[key], value);
  }
  return out;
}

function mergeValue(base: unknown, self: unknown): unknown {
  if (self === undefined) return base;
  if (Array.isArray(base) && Array.isArray(self)) {
    const out = [...base];
    self.forEach((element, index) => {
      out[index] = mergeValue(out[index], element);
    });
    return out;
  }
  if (isRecord(base) && isRecord(self)) return deepMerge(base, self);
  return self;
}

/** Folds `extends` chains in, refusing a cycle by naming the file it revisits. */
export function applyExtends(
  config: Record<string, unknown>,
  configPath: string,
  seen: ReadonlySet<string> = new Set([configPath]),
): Record<string, unknown> {
  const { extends: parent, ...rest } = config;
  if (parent === undefined) return rest;
  if (typeof parent !== 'string' || parent.length === 0) {
    throw configError(configPath, 'extends', 'must be a non-empty string (a module or a path)');
  }
  const requireFrom = createRequire(configPath);
  let parentPath: string;
  try {
    parentPath = requireFrom.resolve(parent);
  } catch {
    const plain = path.resolve(path.dirname(configPath), parent);
    if (!existsSync(plain)) {
      throw configError(configPath, 'extends', `cannot resolve "${parent}"`);
    }
    parentPath = plain;
  }
  if (seen.has(parentPath)) {
    throw configError(configPath, 'extends', `cycle — ${parentPath} is already in this chain`);
  }
  const parentConfig = applyExtends(
    loadConfigFile(parentPath),
    parentPath,
    new Set([...seen, parentPath]),
  );
  return deepMerge(parentConfig, rest);
}

export interface DiscoverOptions {
  cwd: string;
  /** `-C/--config-path` or DETOX_CONFIG_PATH, already precedence-resolved. */
  override?: string;
}

export function discoverConfig({ cwd, override }: DiscoverOptions): DiscoveredConfig {
  const configPath =
    override !== undefined ? resolveConfigOverride(override, cwd) : findConfigFile(cwd);
  if (configPath === undefined) {
    throw configError(
      cwd,
      '',
      `no Detox config found here or in any parent directory — looked for ${CONFIG_FILENAMES.join(', ')} (package.json needs a "detox" key). Pass -C <path> or set DETOX_CONFIG_PATH to name one directly`,
    );
  }
  const config = applyExtends(loadConfigFile(configPath), configPath);
  return { configPath, config };
}
