/**
 * The CLI's two refusal kinds (spec 009): a config refusal names the file
 * and the failing key path and exits non-zero before any process spawns; a
 * usage refusal names the offending token. No wire error codes are minted
 * for either — these are startup failures, not protocol errors.
 */

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/** @issue DTX-5000: formats `configPath: keyPath: reason`, dropping the key path segment when empty. */
export function configError(configPath: string, keyPath: string, reason: string): ConfigError {
  return new ConfigError(
    keyPath === '' ? `${configPath}: ${reason}` : `${configPath}: ${keyPath}: ${reason}`,
  );
}

export class UsageError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'UsageError';
  }
}
