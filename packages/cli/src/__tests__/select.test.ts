/**
 * Configuration selection (spec 009; port of v20 selectConfiguration.js):
 * precedence flag > DETOX_CONFIGURATION > selectedConfiguration >
 * single-configuration default; empty strings count as unset; no winner
 * among several names every configuration; an unknown name is named back.
 */
import { describe, it, expect } from 'vitest';

import { ConfigError } from '../errors';
import { selectConfigurationName } from '../select';

const CONFIG_PATH = '/project/detox.config.js';

function select(config: Record<string, unknown>, flag?: string, env?: string): string {
  return selectConfigurationName({ config, configPath: CONFIG_PATH, flag, env });
}

const TWO = { configurations: { 'ios.debug': {}, 'ios.release': {} } };

describe('selectConfigurationName', () => {
  it('a single configuration is the default winner', () => {
    expect(select({ configurations: { only: {} } })).toBe('only');
  });

  it('precedence: flag > env > selectedConfiguration > single default', () => {
    const config = { ...TWO, selectedConfiguration: 'ios.debug' };
    expect(select(config, 'ios.release', 'ios.debug')).toBe('ios.release');
    expect(select(config, undefined, 'ios.release')).toBe('ios.release');
    expect(select(config)).toBe('ios.debug');
  });

  it('empty strings count as unset at every rung', () => {
    expect(select({ ...TWO, selectedConfiguration: 'ios.release' }, '', '')).toBe('ios.release');
    expect(select({ configurations: { only: {} }, selectedConfiguration: '' }, '', '')).toBe('only');
  });

  it('several configurations and no winner → refusal naming every configuration', () => {
    expect(() => select(TWO)).toThrow(ConfigError);
    expect(() => select(TWO)).toThrow(/ios\.debug, ios\.release/);
    expect(() => select(TWO)).toThrow(/-c <name>/);
  });

  it('an unknown name is named back, with the available list', () => {
    expect(() => select(TWO, 'ios.rlease')).toThrow(/no configuration named "ios\.rlease"/);
    expect(() => select(TWO, 'ios.rlease')).toThrow(/Available: ios\.debug, ios\.release/);
    // The same for env- and file-sourced names.
    expect(() => select(TWO, undefined, 'ghost')).toThrow(/no configuration named "ghost"/);
    expect(() => select({ ...TWO, selectedConfiguration: 'ghost' })).toThrow(/"ghost"/);
  });

  it('no configurations key, an empty one, or a non-object one → refusal', () => {
    expect(() => select({})).toThrow(/configurations.*no configurations to select from/);
    expect(() => select({ configurations: {} })).toThrow(ConfigError);
    expect(() => select({ configurations: ['a'] })).toThrow(ConfigError);
  });

  it('a non-string selectedConfiguration → refusal naming the key', () => {
    expect(() => select({ ...TWO, selectedConfiguration: 42 })).toThrow(
      /selectedConfiguration: must be a string/,
    );
  });

  it('refusals name the config file', () => {
    expect(() => select(TWO)).toThrow(CONFIG_PATH);
  });
});
