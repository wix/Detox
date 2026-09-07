/**
 * The CLI's two refusal kinds (spec 009): ConfigError carries a preformatted
 * message; UsageError speaks the reason bare. Both carry their class name
 * for the bin's exit-path branching.
 */
import { describe, it, expect } from 'vitest';

import { ConfigError, UsageError, configError } from '../errors';

/**
 * @issue DTX-5000
 * `configError` speaks one message shape for every refusal:
 * `configPath: keyPath: reason`, with the key path segment dropped entirely
 * when it is empty (no dangling ": :" for whole-file refusals).
 */
describe('configError', () => {
  it('formats "path: keyPath: reason" when a key path is given', () => {
    const err = configError('/p/detox.config.js', 'client.token', 'must be non-empty');
    expect(err.message).toBe('/p/detox.config.js: client.token: must be non-empty');
    expect(err.name).toBe('ConfigError');
    expect(err).toBeInstanceOf(ConfigError);
    expect(err).toBeInstanceOf(Error);
  });

  it('drops the key path segment entirely when it is empty', () => {
    const err = configError('/p/detox.config.js', '', 'not valid JSON');
    expect(err.message).toBe('/p/detox.config.js: not valid JSON');
  });
});

describe('ConfigError', () => {
  it('takes one preformatted message and names itself', () => {
    const err = new ConfigError('anything at all');
    expect(err.message).toBe('anything at all');
    expect(err.name).toBe('ConfigError');
  });
});

describe('UsageError', () => {
  it('carries the reason and its name', () => {
    const err = new UsageError('Missing value for -c');
    expect(err.message).toBe('Missing value for -c');
    expect(err.name).toBe('UsageError');
    expect(err).toBeInstanceOf(Error);
  });
});
