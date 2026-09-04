/**
 * The built-in `ios.simulator` driver (spec 015), unit-gated: every device
 * verb delegates to `SimulatorOps` (faked here), the query maps the wire's
 * `device`, the gateway lives with the booted device, and `cleanBoot` tracks
 * launch-freeness. The end-to-end launch handshake is covered through the
 * server in app-gateway/launch-options; this file pins the driver's own
 * delegation and the per-device gateway lifecycle on ephemeral ports.
 */
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, it, expect, afterEach, vi } from 'vitest';
import { DetoxErrorCode } from '@detox-remote/core';
import type { DeviceInfo } from '../SimulatorOps';

import { IosSimulatorDriver } from '../IosSimulatorDriver';
import { testLog } from './_harness';
import { AppGateway } from '@detox-remote/server';
import type { SimulatorOps } from '../SimulatorOps';
import type { AppOutputSink } from '@detox-remote/server';

interface Calls {
  [method: string]: unknown[];
}

type FakeOverrides = Partial<Record<string, (...args: unknown[]) => unknown>>;

interface FakeOpsResult {
  ops: SimulatorOps;
  calls: Calls;
}

interface MadeDriver {
  driver: IosSimulatorDriver;
  calls: Calls;
}

interface CaptureFiles {
  stdout: string;
}

/** The slice of a boot call the fake reads: the hook a real boot fires. */
interface BootArg {
  onBootStart?: () => void;
}

interface LaunchCallArg {
  output?: CaptureFiles;
}

function fakeOps(overrides: FakeOverrides = {}): FakeOpsResult {
  const calls: Calls = {};
  const record =
    (name: string, ret: unknown = undefined) =>
    (arg: unknown) => {
      (calls[name] ??= []).push(arg);
      const override = overrides[name];
      return override ? override(arg) : ret;
    };
  const devices: DeviceInfo[] = [
    { name: 'iPhone 17', udid: 'udid-1', state: 'Shutdown', os: { platform: 'iOS' } } as DeviceInfo,
    { name: 'Pixel', udid: 'android-1', state: 'Shutdown', os: { platform: 'Android' } } as DeviceInfo,
  ];
  const ops = {
    list: record('list', devices),
    boot: record('boot', true),
    shutdown: record('shutdown', true),
    resolveFrameworkPath: async () => '/fake/Detox.framework/Detox',
    launch: record('launch', 4242),
    resume: record('resume'),
    terminate: record('terminate'),
    install: record('install'),
    uninstall: record('uninstall'),
    openUrl: record('openUrl'),
    setLocation: record('setLocation'),
    setStatusBar: record('setStatusBar'),
    resetStatusBar: record('resetStatusBar'),
    setBiometricEnrollment: record('setBiometricEnrollment'),
    matchBiometric: record('matchBiometric'),
    clearKeychain: record('clearKeychain'),
    erase: record('erase'),
    sendToHome: record('sendToHome'),
    setPermissions: record('setPermissions'),
    creatableDeviceType: record('creatableDeviceType', undefined),
    create: record('create', 'created-udid'),
    deleteDevice: record('deleteDevice'),
    rawDevices: record('rawDevices', []),
  } as unknown as SimulatorOps;
  return { ops, calls };
}

const drivers: IosSimulatorDriver[] = [];
afterEach(async () => {
  for (const driver of drivers.splice(0)) await driver.close().catch(() => undefined);
});

function makeDriver(overrides?: FakeOverrides): MadeDriver {
  const { ops, calls } = fakeOps(overrides);
  const driver = new IosSimulatorDriver({ simulatorOps: ops, maxPool: 4, preferredPort: 0, listen: (o) => AppGateway.listen(o), log: testLog });
  drivers.push(driver);
  return { driver, calls };
}

describe('IosSimulatorDriver.query', () => {
  it('maps the public dialect’s query to applesimutils flags and refuses a non-object', () => {
    const { driver } = makeDriver();
    expect(driver.query({ deviceId: 'u', model: 't', os: 'o' })).toEqual({
      byId: 'u',
      byType: 't',
      byOS: 'o',
    });
    expect(driver.query(undefined)).toEqual({});
    expect(() => driver.query('nope')).toThrowError(
      expect.objectContaining({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT }),
    );
  });
});

describe('IosSimulatorDriver device lifecycle and verbs', () => {
  it('lists only iOS devices, owns one gateway per booted device, and closes it on shutdown', async () => {
    const { driver, calls } = makeDriver();
    const listed = await driver.list({ query: {} });
    expect(listed.map((d) => d.udid)).toEqual(['udid-1']);

    const booted = await driver.boot({ udid: 'udid-1' });
    expect(booted).toBe(true);
    const device = await driver.device('udid-1');
    expect(device.udid).toBe('udid-1');
    expect(device.apps.url).toMatch(/^ws:\/\/127\.0\.0\.1:\d+$/);
    // Same object on re-ask (one listener per device).
    expect(await driver.device('udid-1')).toBe(device);

    await driver.shutdown({ udid: 'udid-1' });
    expect(calls.shutdown).toHaveLength(1);
    // A fresh gateway is made on the next boot (the old one was closed).
    await driver.boot({ udid: 'udid-1' });
    const reborn = await driver.device('udid-1');
    expect(reborn).not.toBe(device);
  });

  it('launch injects and returns the pid; cleanBoot skips terminate-first once', async () => {
    const { driver, calls } = makeDriver();
    await driver.boot({ udid: 'udid-1' }); // a cold boot → launch-free
    const device = await driver.device('udid-1');
    const url = device.apps.url;
    const result = await driver.launch({ udid: 'udid-1', bundleId: 'com.x', sessionId: 'com.x', serverUrl: url });
    expect(result.pid).toBe(4242);
    // First launch on a clean boot: no terminate-first.
    expect(calls.terminate).toBeUndefined();
    // A second launch is no longer launch-free — it terminates first.
    await driver.launch({ udid: 'udid-1', bundleId: 'com.x', sessionId: 'com.x', serverUrl: url });
    expect(calls.terminate).toHaveLength(1);
  });

  it('delegates every device verb to SimulatorOps', async () => {
    const { driver, calls } = makeDriver();
    await driver.resume({ udid: 'u', bundleId: 'b' });
    await driver.terminate({ udid: 'u', bundleId: 'b' });
    await driver.install({ udid: 'u', appPath: '/tmp/app' });
    await driver.uninstall({ udid: 'u', bundleId: 'b' });
    await driver.openUrl({ udid: 'u', url: 'x://y' });
    await driver.setLocation({ udid: 'u', lat: 1, lon: 2 });
    await driver.setStatusBar({ udid: 'u', overrides: { time: '9:41' } });
    await driver.resetStatusBar({ udid: 'u' });
    await driver.setBiometricEnrollment({ udid: 'u', enabled: true });
    await driver.matchBiometric({ udid: 'u', kind: 'face', matched: true });
    await driver.clearKeychain({ udid: 'u' });
    await driver.erase({ udid: 'u' });
    await driver.sendToHome({ udid: 'u' });
    await driver.setPermissions({ udid: 'u', bundleId: 'b', permissions: { camera: 'YES' } });
    for (const verb of [
      'resume', 'terminate', 'install', 'uninstall', 'openUrl', 'setLocation', 'setStatusBar',
      'resetStatusBar', 'setBiometricEnrollment', 'matchBiometric', 'clearKeychain', 'erase',
      'sendToHome', 'setPermissions',
    ]) {
      expect(calls[verb], verb).toHaveLength(1);
    }
  });

  it('resume/openUrl/sendToHome on a booted device spoil its clean-boot flag', async () => {
    const { driver } = makeDriver();
    await driver.boot({ udid: 'udid-1' });
    const device = await driver.device('udid-1');
    expect(device.cleanBoot).toBe(true); // a cold boot is launch-free
    await driver.resume({ udid: 'udid-1', bundleId: 'b' });
    expect(device.cleanBoot).toBe(false);

    // Re-boot to reset launch-freeness, then openUrl / sendToHome spoil it too.
    device.cleanBoot = true;
    await driver.openUrl({ udid: 'udid-1', url: 'x://y' });
    expect(device.cleanBoot).toBe(false);
    device.cleanBoot = true;
    await driver.sendToHome({ udid: 'udid-1' });
    expect(device.cleanBoot).toBe(false);
  });

  it('closes the device object of a simulator the reconcile loop finds down (Simulator.app quit)', async () => {
    const { driver } = makeDriver(); // the fake listing always says Shutdown
    await driver.boot({ udid: 'udid-1' });
    const device = await driver.device('udid-1');
    driver.start(); // the first tick samples `Shutdown` for a device that has a gateway
    await vi.waitFor(async () => {
      expect(await driver.device('udid-1')).not.toBe(device);
    });
    driver.stop();
  });

  it('logs, and keeps ticking, when closing a down device’s object fails', async () => {
    const { driver } = makeDriver();
    await driver.boot({ udid: 'udid-1' });
    vi.spyOn(driver, 'deviceWentDown').mockRejectedValue(new Error('close boom'));
    const errorSpy = vi.spyOn(testLog, 'error').mockImplementation(() => {});
    driver.start();
    await vi.waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('close boom'), { udid: 'udid-1' });
    });
    driver.stop();
    errorSpy.mockRestore();
  });

  it('shuts a simulator it booted back down when its gateway fails to open — nothing left behind', async () => {
    const { ops, calls } = fakeOps({
      boot: (arg) => {
        (arg as BootArg).onBootStart?.();
        return true;
      },
    });
    const driver = new IosSimulatorDriver({
      simulatorOps: ops,
      maxPool: 4,
      preferredPort: 0,
      listen: () => Promise.reject(new Error('bind boom')),
      log: testLog,
    });
    drivers.push(driver);
    await expect(
      driver.allocate({ allocationId: 'a1', device: {}, requestedType: 'ios.simulator' }),
    ).rejects.toThrow('bind boom');
    expect(calls.boot).toHaveLength(1);
    expect(calls.shutdown).toHaveLength(1);
    expect(driver.pool.busyCount).toBe(0);
  });

  it('a lease installs against its own udid', async () => {
    const { ops, calls } = fakeOps();
    const driver = new IosSimulatorDriver({ simulatorOps: ops, maxPool: 4, preferredPort: 0, listen: (o) => AppGateway.listen(o), log: testLog });
    drivers.push(driver);
    const lease = await driver.allocate({ allocationId: 'a1', device: {}, requestedType: 'ios.simulator' });
    if (!lease.install) throw new Error('the iOS lease is expected to install');
    await lease.install({ appPath: '/tmp/Fixture.app' });
    expect(calls.install).toEqual([{ udid: 'udid-1', appPath: '/tmp/Fixture.app' }]);
    lease.release();
  });

  it('drops a failed gateway so a later device() retry re-listens', async () => {
    const { ops } = fakeOps();
    const driver = new IosSimulatorDriver({ simulatorOps: ops, maxPool: 4, preferredPort: 0, listen: (o) => AppGateway.listen(o), log: testLog });
    drivers.push(driver);
    const spy = vi.spyOn(AppGateway, 'listen').mockRejectedValueOnce(new Error('bind boom'));
    await expect(driver.device('udid-1')).rejects.toThrow('bind boom');
    spy.mockRestore();
    // The failed promise was dropped, so a retry can succeed.
    const device = await driver.device('udid-1');
    expect(device.udid).toBe('udid-1');
  });

  it('captures the app’s output when a sink is given, and returns a stopper', async () => {
    const devicesRoot = mkdtempSync(path.join(tmpdir(), 'detox-ios-driver-'));
    const { ops, calls } = fakeOps();
    const driver = new IosSimulatorDriver({ simulatorOps: ops, maxPool: 4, preferredPort: 0, simulatorDevicesRoot: devicesRoot, listen: (o) => AppGateway.listen(o), log: testLog });
    drivers.push(driver);
    await driver.boot({ udid: 'udid-1' });
    const url = (await driver.device('udid-1')).apps.url;
    const sink: AppOutputSink = { line: () => undefined };
    const result = await driver.launch({
      udid: 'udid-1',
      bundleId: 'com.x',
      sessionId: 'com.x',
      serverUrl: url,
      output: { sink, budgetBytes: 1024 },
    });
    expect(result.pid).toBe(4242);
    expect(typeof result.stopOutput).toBe('function');
    // simctl was handed the capture files under the device's data/tmp.
    const launchArg = calls.launch?.[0] as LaunchCallArg;
    expect(launchArg.output?.stdout).toContain(path.join(devicesRoot, 'udid-1', 'data', 'tmp'));
    result.stopOutput?.();
  });

  it('stops the capture and rethrows when the spawn fails', async () => {
    const devicesRoot = mkdtempSync(path.join(tmpdir(), 'detox-ios-driver-'));
    const { ops } = fakeOps({
      launch: () => Promise.reject(new Error('simctl launch failed')),
    });
    const driver = new IosSimulatorDriver({ simulatorOps: ops, maxPool: 4, preferredPort: 0, simulatorDevicesRoot: devicesRoot, listen: (o) => AppGateway.listen(o), log: testLog });
    drivers.push(driver);
    await driver.boot({ udid: 'udid-1' });
    const url = (await driver.device('udid-1')).apps.url;
    const sink: AppOutputSink = { line: () => undefined };
    await expect(
      driver.launch({ udid: 'udid-1', bundleId: 'com.x', sessionId: 'com.x', serverUrl: url, output: { sink, budgetBytes: 1024 } }),
    ).rejects.toThrow('simctl launch failed');
  });

  it('exposes the pool verbs: creatable, create, deleteDevice, rawDevices', async () => {
    const { driver, calls } = makeDriver({
      creatableDeviceType: () =>
        ({ deviceTypeIdentifier: 'dt', runtime: { identifier: 'rt', name: 'iOS 26', version: '26' } }),
    });
    const creatable = await driver.creatable({ query: { byType: 'iPhone 17' } });
    expect(creatable).toMatchObject({ model: 'iPhone 17', deviceTypeIdentifier: 'dt' });
    // A query that could never create returns undefined without asking.
    expect(await driver.creatable({ query: { byId: 'x' } })).toBeUndefined();
    expect(await driver.create({ name: 'n', deviceTypeIdentifier: 'dt', runtimeIdentifier: 'rt' })).toBe('created-udid');
    await driver.deleteDevice({ udid: 'gone' });
    expect(calls.deleteDevice).toHaveLength(1);
    expect(await driver.rawDevices()).toEqual([]);
    expect(calls.rawDevices).toHaveLength(1);
  });
});
