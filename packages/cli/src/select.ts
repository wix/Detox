/**
 * Configuration selection (spec 009; port of v20 `selectConfiguration.js`).
 * Precedence: `-c/--configuration` > DETOX_CONFIGURATION env > the config's
 * `selectedConfiguration` key > single-configuration default. No winner
 * among several → refusal naming every configuration; an unknown name →
 * refusal naming it back.
 */
import { configError } from './errors';

export interface SelectInput {
  config: Record<string, unknown>;
  configPath: string;
  /** `-c` value, if given (flag beats env). */
  flag?: string;
  /** DETOX_CONFIGURATION — empty string counts as unset. */
  env?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function selectConfigurationName({ config, configPath, flag, env }: SelectInput): string {
  const configurations = config.configurations;
  if (!isRecord(configurations) || Object.keys(configurations).length === 0) {
    throw configError(
      configPath,
      'configurations',
      'the config has no configurations to select from',
    );
  }
  const names = Object.keys(configurations);
  const selectedKey = config.selectedConfiguration;
  if (selectedKey !== undefined && typeof selectedKey !== 'string') {
    throw configError(configPath, 'selectedConfiguration', 'must be a string');
  }
  const winner =
    (flag || undefined) ??
    (env || undefined) ??
    (selectedKey || undefined) ??
    (names.length === 1 ? names[0] : undefined);
  if (winner === undefined) {
    throw configError(
      configPath,
      'configurations',
      `several configurations and no selection — pass -c <name> (or set DETOX_CONFIGURATION). Available: ${names.join(', ')}`,
    );
  }
  if (!(winner in configurations)) {
    throw configError(
      configPath,
      'configurations',
      `no configuration named "${winner}". Available: ${names.join(', ')}`,
    );
  }
  return winner;
}
