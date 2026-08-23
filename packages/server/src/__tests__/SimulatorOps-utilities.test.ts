/**
 * Exact-argv pins for the device-utilities toolbelt (spec 005).
 *
 * Why this file is mandatory: the accept suite can physically
 * gate only the utilities the simulator can be asked about from outside (status
 * bar, openURL, biometric enrollment). For the rest — location, keychain,
 * face/finger match — "the call resolved" is not a gate, and a silent no-op
 * would sail straight through the accept run. What makes a no-op impossible is
 * pinning the exact command each verb issues, which is what this file does.
 *
 * The exec module is mocked, so no simulator is touched: the subject under test
 * is the argv array, not CoreSimulator. `SimulatorOps` stays outside the
 * coverage scope (see vitest.config.ts) — its real behaviour is acceptance's
 * job; its *command lines* are this file's.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DetoxErrorCode } from '@detox-remote/core';

import type { ExecOpts } from '../exec';
import { SimulatorOps } from '../SimulatorOps';

const { execMock } = vi.hoisted(() => ({ execMock: vi.fn() }));
vi.mock('../exec', () => ({ execWithRetries: execMock }));

const UDID = 'PROBE-UDID';

function argvOf(callIndex = 0): string[] {
  const opts = execMock.mock.calls[callIndex][0] as ExecOpts;
  return [opts.file, ...opts.args];
}

function optsOf(callIndex = 0): ExecOpts {
  return execMock.mock.calls[callIndex][0] as ExecOpts;
}

beforeEach(() => {
  execMock.mockReset();
  execMock.mockResolvedValue({ stdout: '', stderr: '' });
});

describe('the quick utilities issue exactly one pinned command each', () => {
  it('uninstall names the bundle id and nothing else', async () => {
    await new SimulatorOps().uninstall({ udid: UDID, bundleId: 'com.example.doomed' });
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(argvOf()).toEqual(['/usr/bin/xcrun', 'simctl', 'uninstall', UDID, 'com.example.doomed']);
  });

  it('openurl hands the URL over untouched — no resolution, no rewriting', async () => {
    await new SimulatorOps().openUrl({ udid: UDID, url: 'http://127.0.0.1:8080/token?a=b#c' });
    expect(argvOf()).toEqual([
      '/usr/bin/xcrun',
      'simctl',
      'openurl',
      UDID,
      'http://127.0.0.1:8080/token?a=b#c',
    ]);
  });

  it('location packs lat and lon into one comma-joined argv slot', async () => {
    await new SimulatorOps().setLocation({ udid: UDID, lat: 32.0853, lon: 34.7818 });
    expect(argvOf()).toEqual(['/usr/bin/xcrun', 'simctl', 'location', UDID, 'set', '32.0853,34.7818']);
  });

  /**
   * @issue DTX-6126
   * Ported from Detox 20 (`AppleSimUtils.clearKeychain`, which shelled
   * out to applesimutils `--clearKeychain`); simctl grew a first-party
   * verb since, dropping a third-party binary from this path entirely.
   */
  it('keychain reset is a first-party simctl verb, not a shell-out to applesimutils', async () => {
    await new SimulatorOps().clearKeychain({ udid: UDID });
    expect(argvOf()).toEqual(['/usr/bin/xcrun', 'simctl', 'keychain', UDID, 'reset']);
  });

  /**
   * @issue DTX-6111
   * Only the fields the caller actually sent become argv flags — absent
   * means "leave this one alone", so `setStatusBar({ time })` cannot
   * quietly reset the battery.
   */
  it('status-bar override emits a flag ONLY for the fields the caller sent', async () => {
    await new SimulatorOps().setStatusBar({ udid: UDID, overrides: { time: '12:34' } });
    expect(argvOf()).toEqual([
      '/usr/bin/xcrun',
      'simctl',
      'status_bar',
      UDID,
      'override',
      '--time',
      '12:34',
    ]);
  });

  /**
   * @issue DTX-6110
   * Detox 20's `statusBarOverride` tested each flag for truthiness, so
   * `wifiBars: 0` and `batteryLevel: 0` — both legal, both meaningful —
   * were silently dropped. Zero is a value here.
   */
  it('treats 0 as a value, not as absence', async () => {
    await new SimulatorOps().setStatusBar({
      udid: UDID,
      overrides: { wifiBars: 0, batteryLevel: 0, cellularBars: 0 },
    });
    expect(argvOf()).toEqual([
      '/usr/bin/xcrun',
      'simctl',
      'status_bar',
      UDID,
      'override',
      '--wifiBars',
      '0',
      '--batteryLevel',
      '0',
      '--cellularBars',
      '0',
    ]);
  });

  it('spawns no subprocess at all when there is nothing to override', async () => {
    await new SimulatorOps().setStatusBar({ udid: UDID, overrides: {} });
    expect(execMock).not.toHaveBeenCalled();
  });

  it('status-bar reset clears every override', async () => {
    await new SimulatorOps().resetStatusBar({ udid: UDID });
    expect(argvOf()).toEqual(['/usr/bin/xcrun', 'simctl', 'status_bar', UDID, 'clear']);
  });

  /**
   * Enrollment is persistent notify state: set it, then post it. The key is
   * the one the accept suite reads back with `notifyutil -g`
   * (`specs/helpers/simctl.ts` — `biometricEnrollmentState`); if the write and
   * the readback ever name different keys, test 5 goes red, and this pin says why.
   */
  it('enrollment sets and posts the exact notify key the readback uses', async () => {
    await new SimulatorOps().setBiometricEnrollment({ udid: UDID, enabled: true });
    expect(argvOf()).toEqual([
      '/usr/bin/xcrun',
      'simctl',
      'spawn',
      UDID,
      'notifyutil',
      '-s',
      'com.apple.BiometricKit.enrollmentChanged',
      '1',
      '-p',
      'com.apple.BiometricKit.enrollmentChanged',
    ]);

    execMock.mockClear();
    await new SimulatorOps().setBiometricEnrollment({ udid: UDID, enabled: false });
    // The full argv, like the `true` case: `toContain('0')` would pass on any
    // command line that happened to have a zero anywhere in it.
    expect(argvOf()).toEqual([
      '/usr/bin/xcrun',
      'simctl',
      'spawn',
      UDID,
      'notifyutil',
      '-s',
      'com.apple.BiometricKit.enrollmentChanged',
      '0',
      '-p',
      'com.apple.BiometricKit.enrollmentChanged',
    ]);
  });

  /**
   * @issue DTX-6117
   * The device is addressed by udid, never `--booted`. Detox 20's
   * applesimutils path switched to `--booted` on iOS 26+, which is
   * ambiguous the moment two simulators are up — the normal case on a
   * pool server.
   */
  it('match/unmatch post the four one-shot keys, addressed by udid', async () => {
    const ops = new SimulatorOps();
    const cases = [
      { kind: 'face', matched: true, key: 'com.apple.BiometricKit_Sim.pearl.match' },
      { kind: 'face', matched: false, key: 'com.apple.BiometricKit_Sim.pearl.nomatch' },
      { kind: 'finger', matched: true, key: 'com.apple.BiometricKit_Sim.fingerTouch.match' },
      { kind: 'finger', matched: false, key: 'com.apple.BiometricKit_Sim.fingerTouch.nomatch' },
    ] as const;
    for (const { kind, matched, key } of cases) {
      execMock.mockClear();
      await ops.matchBiometric({ udid: UDID, kind, matched });
      expect(argvOf()).toEqual(['/usr/bin/xcrun', 'simctl', 'spawn', UDID, 'notifyutil', '-p', key]);
    }
  });

  it('erase is a bare `simctl erase <udid>`', async () => {
    await new SimulatorOps().erase({ udid: UDID });
    expect(argvOf()).toEqual(['/usr/bin/xcrun', 'simctl', 'erase', UDID]);
  });

  it('bounds every utility with a timeout — none of them may hang the server', async () => {
    const ops = new SimulatorOps();
    const calls = [
      () => ops.uninstall({ udid: UDID, bundleId: 'com.example.app' }),
      () => ops.openUrl({ udid: UDID, url: 'https://example.com' }),
      () => ops.setLocation({ udid: UDID, lat: 1, lon: 2 }),
      () => ops.setStatusBar({ udid: UDID, overrides: { time: '1:00' } }),
      () => ops.resetStatusBar({ udid: UDID }),
      () => ops.clearKeychain({ udid: UDID }),
      () => ops.setBiometricEnrollment({ udid: UDID, enabled: true }),
      () => ops.matchBiometric({ udid: UDID, kind: 'face', matched: true }),
      () => ops.erase({ udid: UDID }),
    ];
    for (const call of calls) {
      execMock.mockClear();
      await call();
      expect(optsOf().timeout).toBeGreaterThan(0);
    }
  });

  /**
   * @issue DTX-6113
   * The retry count is part of each verb's contract: inherited silently
   * from `_execSimctl`'s default of 1, every ceiling above doubles
   * (~121 s for a "quick" utility), and `matchBiometric` — a one-shot
   * Darwin notification with no readback — would deliver its event
   * twice with no layer able to notice.
   * @issue DTX-6114
   * `openUrl` is the one exception: a cold Safari's first open after
   * boot can outlive simctl's own ack while the URL still lands, so an
   * ack timeout is not proof of non-delivery and re-opening the same
   * URL is harmless.
   */
  it('pins the retry count of every verb: none retries, except openurl, deliberately', async () => {
    const ops = new SimulatorOps();
    const cases: Array<[string, () => Promise<unknown>, number]> = [
      ['uninstall', () => ops.uninstall({ udid: UDID, bundleId: 'com.example.app' }), 0],
      ['setLocation', () => ops.setLocation({ udid: UDID, lat: 1, lon: 2 }), 0],
      ['setStatusBar', () => ops.setStatusBar({ udid: UDID, overrides: { time: '1:00' } }), 0],
      ['resetStatusBar', () => ops.resetStatusBar({ udid: UDID }), 0],
      ['clearKeychain', () => ops.clearKeychain({ udid: UDID }), 0],
      ['setBiometricEnrollment', () => ops.setBiometricEnrollment({ udid: UDID, enabled: true }), 0],
      ['matchBiometric', () => ops.matchBiometric({ udid: UDID, kind: 'face', matched: true }), 0],
      ['erase', () => ops.erase({ udid: UDID }), 0],
      // The one exception (DTX-6114).
      ['openUrl', () => ops.openUrl({ udid: UDID, url: 'https://example.com' }), 1],
    ];
    for (const [label, call, retries] of cases) {
      execMock.mockClear();
      await call();
      expect(optsOf().retries, label).toBe(retries);
    }
  });
});

describe('the caller signal reaches every utility child — except the erase', () => {
  it('threads the caller signal into the cancellable utilities', async () => {
    const controller = new AbortController();
    const ops = new SimulatorOps();
    const calls = [
      () => ops.uninstall({ udid: UDID, bundleId: 'com.example.app', signal: controller.signal }),
      () => ops.openUrl({ udid: UDID, url: 'https://example.com', signal: controller.signal }),
      () => ops.setLocation({ udid: UDID, lat: 1, lon: 2, signal: controller.signal }),
      () => ops.resetStatusBar({ udid: UDID, signal: controller.signal }),
      () => ops.clearKeychain({ udid: UDID, signal: controller.signal }),
      () => ops.setBiometricEnrollment({ udid: UDID, enabled: true, signal: controller.signal }),
      () => ops.matchBiometric({ udid: UDID, kind: 'finger', matched: false, signal: controller.signal }),
    ];
    for (const call of calls) {
      execMock.mockClear();
      await call();
      expect(optsOf().signal).toBe(controller.signal);
    }
  });

  /**
   * @issue DTX-6112
   * `erase` takes no signal parameter, so there is nothing for a
   * caller's cancellation to travel down. The exec layer kills the
   * child on abort — that is precisely why the signal must never get
   * here.
   */
  it('hands the erase child no signal at all — it can never be killed by a caller', async () => {
    await new SimulatorOps().erase({ udid: UDID });
    expect(optsOf().signal).toBeUndefined();
    // …and no retry either: a wedged erase must not be spawned twice.
    expect(optsOf().retries).toBe(0);
  });
});

describe('a wedged erase is reported as an unknown device state', () => {
  /**
   * @issue DTX-6116
   * Only the server's own deadline can end an erase, and when it does,
   * what the simulator is becomes unknowable. The exec
   * layer's kill shows up as `killed: true`; anything else is an
   * ordinary failure and keeps its own identity rather than being
   * upgraded to an infra verdict.
   */
  it('turns a deadline kill into the typed device-unknown-state error', async () => {
    execMock.mockRejectedValue(Object.assign(new Error('simctl erase killed'), { killed: true }));
    await expect(new SimulatorOps().erase({ udid: UDID })).rejects.toMatchObject({
      name: 'DeviceUnknownStateError',
      code: DetoxErrorCode.DETOX_DEVICE_UNKNOWN_STATE,
      details: { udid: UDID },
    });
  });

  /**
   * @issue DTX-6120
   * An ordinary simctl failure is rethrown untouched — never upgraded
   * to an infra verdict the device never earned.
   */
  it('lets an ordinary erase failure through untouched', async () => {
    const failure = new Error('Unable to erase contents and settings in current state: Booted');
    execMock.mockRejectedValue(failure);
    const caught = await new SimulatorOps().erase({ udid: UDID }).catch((err: unknown) => err);
    expect(caught).toBe(failure);
  });
});

describe('argv-shaped values are refused, typed', () => {
  /**
   * @issue DTX-6121
   * `execFile` keeps client strings out of a shell, but not out of the
   * called tool's own option parser: a leading `-` can turn a URL or a
   * bundle id into a flag. The refusal is minted in the error registry —
   * the pre-005 guard threw a bare `Error`, so the one refusal that
   * should read loudest arrived as `DETOX_UNCLASSIFIED` ("the server
   * broke").
   */
  it.each([
    ['openUrl', (ops: InstanceType<typeof SimulatorOps>) => ops.openUrl({ udid: UDID, url: '--help' })],
    ['uninstall', (ops: InstanceType<typeof SimulatorOps>) => ops.uninstall({ udid: UDID, bundleId: '-rf' })],
    [
      'setStatusBar',
      (ops: InstanceType<typeof SimulatorOps>) =>
        ops.setStatusBar({ udid: UDID, overrides: { operatorName: '--time' } }),
    ],
    [
      'list',
      (ops: InstanceType<typeof SimulatorOps>) => ops.list({ query: { byName: '--wipe' } }),
    ],
  ])('%s refuses a flag-shaped value with a Detox code, and spawns nothing', async (_label, call) => {
    await expect(call(new SimulatorOps())).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
    });
    expect(execMock).not.toHaveBeenCalled();
  });
});

/**
 * @issue DTX-6109
 * The tolerance a compensation needs, and a live caller must not get. A
 * rollback retained for a minute (batch A2) can reach a device that has
 * since been shut down, evicted, or wiped; there "your app is not
 * running" is the truth, and answering `undo-failed` over it would
 * treat a provably clean resource as suspect.
 */
describe('terminate tolerates a device that is down — only when asked to', () => {
  const downDevice = Object.assign(new Error('simctl failed'), {
    stderr: 'An error was encountered processing the command: Unable to lookup in current state: Shutdown',
  });

  it('rethrows for an ordinary caller', async () => {
    execMock.mockRejectedValueOnce(downDevice);
    await expect(
      new SimulatorOps().terminate({ udid: UDID, bundleId: 'com.example.app' }),
    ).rejects.toThrow('simctl failed');
  });

  it('swallows it for a compensation', async () => {
    execMock.mockRejectedValueOnce(downDevice);
    await expect(
      new SimulatorOps().terminate({
        udid: UDID,
        bundleId: 'com.example.app',
        tolerateDownDevice: true,
      }),
    ).resolves.toBeUndefined();
  });

  it('still rethrows a real failure even for a compensation', async () => {
    execMock.mockRejectedValueOnce(
      Object.assign(new Error('simctl failed'), { stderr: 'Operation not permitted' }),
    );
    await expect(
      new SimulatorOps().terminate({
        udid: UDID,
        bundleId: 'com.example.app',
        tolerateDownDevice: true,
      }),
    ).rejects.toThrow('simctl failed');
  });
});
