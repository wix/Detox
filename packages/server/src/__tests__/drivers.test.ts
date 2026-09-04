/**
 * The driver host (spec 015): `device.type` resolution — the
 * built-in name, the reserved legacy names, path-shaped refusals, the lazy
 * cached npm import, and the not-a-driver refusals. The import path is faked
 * (a real `import()` would need a package on disk); accept test 3 exercises
 * the real import of the workspace fake driver.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { DetoxErrorCode } from '@detox-remote/core';

import { DriverHost, BUILTIN_DEVICE_TYPE, LEGACY_DEVICE_TYPES, isPathShaped } from '../drivers';
import type { DeviceDriver, DriverModule, DriverToolkit } from '../driver';
import { serverLog } from '../log-sink';

/** A minimal driver good enough for `isDriverShaped` and `resolve`. */
function fakeDriver(overrides: Partial<DeviceDriver> = {}): DeviceDriver {
  const base: DeviceDriver = {
    allocate: async () => {
      throw new Error('no device in this fake');
    },
    close: async () => undefined,
  };
  return { ...base, ...overrides };
}

const hosts: DriverHost[] = [];
afterEach(async () => {
  for (const host of hosts.splice(0)) await host.close().catch(() => undefined);
});

function makeHost(options: { importer?: (s: string) => Promise<unknown> } = {}): DriverHost {
  const host = new DriverHost({
    maxPool: 4,
    builtin: [{ type: BUILTIN_DEVICE_TYPE, driver: fakeDriver() }],
    importer: options.importer,
  });
  hosts.push(host);
  return host;
}

describe('isPathShaped (spec 015: a request names a package, never a file)', () => {
  it('rejects paths, URLs, home and parent segments, backslashes, whitespace, and empty', () => {
    for (const s of ['', './x', '../x', '/abs', '~/home', 'a/../b', '..', 'a\\b', 'a b', 'file:///x', 'http://x']) {
      expect(isPathShaped(s)).toBe(true);
    }
  });
  it('accepts bare and scoped package specifiers', () => {
    for (const s of ['lodash', 'lodash/map', '@acme/detox-driver-foo', 'cool-drivers/ios', 'spec015-fake-driver']) {
      expect(isPathShaped(s)).toBe(false);
    }
  });
});

describe('DriverHost.resolve', () => {
  it('returns the built-in driver for its name, and lists its drivers', () => {
    const host = makeHost();
    expect(host.drivers.map((d) => d.type)).toEqual([BUILTIN_DEVICE_TYPE]);
  });

  it('refuses a non-string type with DETOX_INVALID_ARGUMENT', async () => {
    const host = makeHost();
    await expect(host.resolve(undefined)).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    await expect(host.resolve('')).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
  });

  it('refuses a reserved legacy name with DETOX_NO_MATCHING_DEVICE / unknown-type', async () => {
    const host = makeHost();
    for (const type of LEGACY_DEVICE_TYPES.filter((t) => t !== BUILTIN_DEVICE_TYPE)) {
      await expect(host.resolve(type)).rejects.toMatchObject({
        code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE,
        details: { reason: 'unknown-type', type },
      });
    }
  });

  it('refuses a path-shaped type before any import', async () => {
    let imported = false;
    const host = makeHost({
      importer: async () => {
        imported = true;
        return {};
      },
    });
    await expect(host.resolve('./specs/fake-driver')).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE,
      details: { reason: 'path-shaped' },
    });
    expect(imported).toBe(false);
  });

  it('refuses an unimportable package with unknown-type, carrying the resolution error', async () => {
    const host = makeHost({
      importer: () => Promise.reject(new Error('Cannot find module')),
    });
    const attempt = host.resolve('no-such-driver-package');
    await expect(attempt).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE,
      details: { reason: 'unknown-type', type: 'no-such-driver-package' },
    });
    // The resolution error rides the message.
    await expect(attempt).rejects.toThrow(/Cannot find module/);
  });

  it('refuses a module with no createDriver export as not-a-driver', async () => {
    const host = makeHost({ importer: async () => ({ notCreateDriver: 1 }) });
    await expect(host.resolve('bad-driver-pkg')).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE,
      details: { reason: 'not-a-driver' },
    });
  });

  it('refuses a createDriver that returns a non-driver as not-a-driver', async () => {
    const mod: DriverModule = { createDriver: () => ({ nope: true }) as unknown as DeviceDriver };
    const host = makeHost({ importer: async () => mod });
    await expect(host.resolve('shapeless-driver')).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE,
      details: { reason: 'not-a-driver' },
    });
  });

  it('refuses a createDriver that throws as not-a-driver', async () => {
    const mod: DriverModule = {
      createDriver: () => {
        throw new Error('boom');
      },
    };
    const host = makeHost({ importer: async () => mod });
    await expect(host.resolve('throwing-driver')).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE,
      details: { reason: 'not-a-driver' },
    });
  });

  it('imports a valid driver once and caches it; the toolkit is handed in', async () => {
    let imports = 0;
    let toolkit: DriverToolkit | undefined;
    const driver = fakeDriver();
    const mod: DriverModule = {
      createDriver: (t) => {
        toolkit = t;
        // Exercise the toolkit surface the host provides.
        t.log.info('driver up');
        t.log.warn('a warning');
        t.log.error('an error');
        return driver;
      },
    };
    const host = makeHost({
      importer: async () => {
        imports += 1;
        return mod;
      },
    });
    host.start();
    const first = await host.resolve('@acme/detox-driver-foo');
    const second = await host.resolve('@acme/detox-driver-foo');
    expect(first.driver).toBe(driver);
    expect(second).toBe(first);
    expect(imports).toBe(1);
    expect(toolkit).toBeDefined();
    // The toolkit carries the server's cap and the typed error the wire understands.
    expect(toolkit!.maxPool).toBe(4);
    expect(new toolkit!.errors.DetoxError('x', { code: toolkit!.errors.DetoxErrorCode.DETOX_NO_MATCHING_DEVICE })).toMatchObject({
      code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE,
    });
    // The toolkit can open a real gateway; open and close one to cover the seam.
    const gw = await toolkit!.appGateway.listen({ deviceId: 'x' });
    await gw.close();
  });

  it('resolves the driver from a module default export too', async () => {
    const driver = fakeDriver();
    const host = makeHost({ importer: async () => ({ default: { createDriver: () => driver } }) });
    const resolved = await host.resolve('default-export-driver');
    expect(resolved.driver).toBe(driver);
  });

  it('two concurrent resolves share one import', async () => {
    let imports = 0;
    const driver = fakeDriver();
    const host = makeHost({
      importer: async () => {
        imports += 1;
        await Promise.resolve();
        return { createDriver: () => driver };
      },
    });
    const [a, b] = await Promise.all([host.resolve('concurrent-driver'), host.resolve('concurrent-driver')]);
    expect(a).toBe(b);
    expect(imports).toBe(1);
  });

  it('refuses to import once the host is closing', async () => {
    const host = makeHost({ importer: async () => ({ createDriver: () => fakeDriver() }) });
    await host.close();
    await expect(host.resolve('late-driver')).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE,
      details: { reason: 'unknown-type' },
    });
  });

  it('closes a driver whose import resolved after the host closed', async () => {
    let resolveImport!: (mod: unknown) => void;
    const host = makeHost({ importer: () => new Promise((resolve) => { resolveImport = resolve; }) });
    let closed = 0;
    const driver = fakeDriver({ close: async () => { closed += 1; } });
    const attempt = host.resolve('late-driver');
    await host.close();
    resolveImport({ createDriver: () => driver });
    await expect(attempt).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE,
      details: { reason: 'unknown-type' },
    });
    expect(closed).toBe(1);

    // …and a late driver whose own close throws is logged, not thrown into the resolve.
    let resolveSecond!: (mod: unknown) => void;
    const second = makeHost({ importer: () => new Promise((resolve) => { resolveSecond = resolve; }) });
    const errorSpy = vi.spyOn(serverLog, 'error').mockImplementation(() => {});
    const lateAttempt = second.resolve('late-driver');
    await second.close();
    resolveSecond({ createDriver: () => fakeDriver({ close: async () => { throw new Error('late close failed'); } }) });
    await expect(lateAttempt).rejects.toMatchObject({ details: { reason: 'unknown-type' } });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('late close failed'));
    errorSpy.mockRestore();
  });

  it('uses Node’s own import() by default — an unknown package rejects unknown-type', async () => {
    // No importer override: the default `(s) => import(s)` runs against a
    // package that does not exist, exercising the real dynamic-import seam.
    const host = new DriverHost({ maxPool: 4, builtin: [] });
    hosts.push(host);
    await expect(host.resolve('definitely-not-a-real-detox-driver-xyz')).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE,
      details: { reason: 'unknown-type' },
    });
  });

  it('close swallows a driver whose own close throws, and stop is idempotent', async () => {
    const driver = fakeDriver({
      close: () => Promise.reject(new Error('close failed')),
    });
    const host = new DriverHost({ maxPool: 4, builtin: [{ type: BUILTIN_DEVICE_TYPE, driver }] });
    host.start();
    host.stop();
    await expect(host.close()).resolves.toBeUndefined();
  });
});
