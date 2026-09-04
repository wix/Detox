/**
 * Descriptor-driven, not per-setting: this suite iterates `SERVER_SETTINGS`,
 * `RELAY_SETTINGS` and `CLIENT_SETTINGS` themselves rather than naming each
 * flag/env var by hand, so a new descriptor is covered the moment it is
 * declared — or the "every descriptor has a fixture" test fails, naming it.
 * Pure functions only, no process spawned.
 */
import { describe, it, expect } from 'vitest';

import { resolveSection, toChildArgs, configShape, SettingsError, type SettingDescriptor } from '@detox-remote/core';
import { SERVER_SETTINGS } from '@detox-remote/server';
import { RELAY_SETTINGS } from 'detox-relay';
import { CLIENT_SETTINGS } from '../settings';

const SECTIONS: Record<string, readonly SettingDescriptor[]> = {
  server: SERVER_SETTINGS,
  relay: RELAY_SETTINGS,
  client: CLIENT_SETTINGS,
};

/**
 * One entry per distinct descriptor key across all three sections — `wire`
 * is what a flag/env value looks like (always a string); `parsed` is what
 * `resolveSection` must produce from it. Add an entry here for a new
 * setting; the exhaustiveness test below refuses to pass without one.
 */
const FIXTURES: Record<string, { wire: string; parsed: unknown }> = {
  host: { wire: '0.0.0.0', parsed: '0.0.0.0' },
  port: { wire: '9000', parsed: 9000 },
  token: { wire: 'abcdefgh', parsed: 'abcdefgh' },
  maxPool: { wire: '4', parsed: 4 },
  keepaliveWindow: { wire: '120', parsed: 120 },
  blobBudget: { wire: '1024', parsed: 1024 },
  blobRoot: { wire: '/tmp/detox-test-blob-root', parsed: '/tmp/detox-test-blob-root' },
  logLevel: { wire: 'debug', parsed: 'debug' },
  logRetention: { wire: '10m', parsed: '10m' },
  logBudget: { wire: '2048', parsed: 2048 },
  logRoot: { wire: '/tmp/detox-test-log-root', parsed: '/tmp/detox-test-log-root' },
  childOutputBudget: { wire: '65536', parsed: 65536 },
  appOutputBudget: { wire: '1048576', parsed: 1048576 },
  server: { wire: 'ws://127.0.0.1:8080', parsed: 'ws://127.0.0.1:8080' },
  autostart: { wire: 'n/a — config-only, no flag or env', parsed: false },
};

describe.each(Object.entries(SECTIONS))('%s settings', (_sectionName, descriptors) => {
  it('every descriptor has a FIXTURES entry', () => {
    for (const d of descriptors) {
      expect(Object.hasOwn(FIXTURES, d.key), `add FIXTURES['${d.key}']`).toBe(true);
    }
  });

  it.each(descriptors.map((d): [string, SettingDescriptor] => [d.key, d]))(
    '%s: flag beats env beats config',
    (key, descriptor) => {
      const fx = FIXTURES[key];
      if (fx === undefined || descriptor.flag === undefined) return;
      const resolved = resolveSection([descriptor], {
        argv: [descriptor.flag, fx.wire],
        env: descriptor.env ? { [descriptor.env]: '\0unreachable-env' } : {},
        config: { [key]: '\0unreachable-config' },
      });
      expect(resolved[key]).toEqual(fx.parsed);
    },
  );

  it.each(descriptors.map((d): [string, SettingDescriptor] => [d.key, d]))(
    '%s: env beats config',
    (key, descriptor) => {
      const fx = FIXTURES[key];
      if (fx === undefined || descriptor.env === undefined) return;
      const resolved = resolveSection([descriptor], {
        argv: [],
        env: { [descriptor.env]: fx.wire },
        config: { [key]: '\0unreachable-config' },
      });
      expect(resolved[key]).toEqual(fx.parsed);
    },
  );

  it.each(descriptors.map((d): [string, SettingDescriptor] => [d.key, d]))(
    '%s: config alone resolves, in its own already-typed form',
    (key, descriptor) => {
      const fx = FIXTURES[key];
      if (fx === undefined) return;
      const resolved = resolveSection([descriptor], { argv: [], env: {}, config: { [key]: fx.parsed } });
      expect(resolved[key]).toEqual(fx.parsed);
    },
  );

  it.each(descriptors.map((d): [string, SettingDescriptor] => [d.key, d]))(
    '%s: a declared-but-empty env var is absent, unless strictEnv refuses it',
    (key, descriptor) => {
      const fx = FIXTURES[key];
      if (fx === undefined || descriptor.env === undefined) return;
      if (descriptor.strictEnv) {
        expect(() => resolveSection([descriptor], { argv: [], env: { [descriptor.env!]: '' } })).toThrow(
          SettingsError,
        );
        return;
      }
      const resolved = resolveSection([descriptor], {
        argv: [],
        env: { [descriptor.env]: '' },
        config: { [key]: fx.parsed },
      });
      expect(resolved[key]).toEqual(fx.parsed);
    },
  );

  it.each(descriptors.map((d): [string, SettingDescriptor] => [d.key, d]))(
    '%s: toChildArgs → resolveSection round-trips to the same value',
    (key, descriptor) => {
      const fx = FIXTURES[key];
      if (fx === undefined || descriptor.flag === undefined) return;
      const argv = toChildArgs([descriptor], { [key]: fx.parsed }, [], {});
      expect(argv).toEqual([descriptor.flag, String(fx.parsed)]);
      const resolved = resolveSection([descriptor], { argv, env: {} });
      expect(resolved[key]).toEqual(fx.parsed);
    },
  );

  it.each(descriptors.map((d): [string, SettingDescriptor] => [d.key, d]))(
    "%s: toChildArgs forwards nothing when the child's own env mirror already covers it",
    (key, descriptor) => {
      const fx = FIXTURES[key];
      if (fx === undefined || descriptor.flag === undefined || descriptor.env === undefined) return;
      const argv = toChildArgs([descriptor], { [key]: fx.parsed }, [], { [descriptor.env]: fx.wire });
      expect(argv).not.toContain(descriptor.flag);
    },
  );

  it('configShape carries exactly the non-internal, non-noConfigKey descriptors', () => {
    const shape = configShape(descriptors);
    for (const d of descriptors) {
      const shouldAppear = !d.internal && !d.noConfigKey;
      expect(Object.hasOwn(shape, d.key), `${d.key} in configShape`).toBe(shouldAppear);
    }
  });

  it('no two descriptors in this section share a flag', () => {
    const flags = descriptors.map((d) => d.flag).filter((f) => f !== undefined);
    expect(new Set(flags).size).toBe(flags.length);
  });
});

it('no two descriptors across ALL sections share an env var (the DETOX_BLOB_ROOT-shared-by-two-daemons class of bug)', () => {
  const allEnvVars = Object.values(SECTIONS)
    .flatMap((descriptors) => descriptors)
    .map((d) => d.env)
    .filter((e) => e !== undefined);
  const duplicates = allEnvVars.filter((name, i) => allEnvVars.indexOf(name) !== i);
  expect(duplicates).toEqual([]);
});
