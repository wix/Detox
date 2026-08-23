/**
 * Exact-argv pins for spec 006's SimulatorOps additions: the permissions
 * dispatch table, the launch argv composition (user args first, payload argv
 * next, the frozen detox pair LAST), and `resume` — which must prove by its
 * argv that a foreground is not a launch transaction.
 *
 * Same rationale as SimulatorOps-utilities.test.ts: the accept suite can read
 * TCC back for only two backends' worth of services; for the rest, "the call
 * resolved" gates nothing — the command line is the contract, so the command
 * line is what gets pinned. The exec module is mocked; no simulator is
 * touched.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DetoxErrorCode } from '@detox-remote/core';

import type { ExecOpts } from '../exec';
import { SimulatorOps } from '../SimulatorOps';

const { execMock } = vi.hoisted(() => ({ execMock: vi.fn() }));
vi.mock('../exec', () => ({ execWithRetries: execMock }));

const UDID = 'PROBE-UDID';
const BUNDLE = 'com.example.app';

function argvOf(callIndex = 0): string[] {
  const opts = execMock.mock.calls[callIndex][0] as ExecOpts;
  return [opts.file, ...opts.args];
}

function optsOf(callIndex = 0): ExecOpts {
  return execMock.mock.calls[callIndex][0] as ExecOpts;
}

beforeEach(() => {
  execMock.mockReset();
  execMock.mockResolvedValue({ stdout: `${BUNDLE}: 4242`, stderr: '' });
});

function privacy(action: string, service: string): string[] {
  return ['/usr/bin/xcrun', 'simctl', 'privacy', UDID, action, service, BUNDLE];
}

describe('setPermissions — the dispatch table, argv-exact', () => {
  it('location speaks its four-value vocabulary through simctl privacy', async () => {
    const ops = new SimulatorOps();
    await ops.setPermissions({ udid: UDID, bundleId: BUNDLE, permissions: { location: 'always' } });
    expect(argvOf(0)).toEqual(privacy('grant', 'location-always'));
    await ops.setPermissions({ udid: UDID, bundleId: BUNDLE, permissions: { location: 'inuse' } });
    expect(argvOf(1)).toEqual(privacy('grant', 'location'));
    await ops.setPermissions({ udid: UDID, bundleId: BUNDLE, permissions: { location: 'never' } });
    expect(argvOf(2)).toEqual(privacy('revoke', 'location'));
    await ops.setPermissions({ udid: UDID, bundleId: BUNDLE, permissions: { location: 'unset' } });
    expect(argvOf(3)).toEqual(privacy('reset', 'location'));
  });

  it('the basic TCC services map YES/NO/unset to grant/revoke/reset', async () => {
    const ops = new SimulatorOps();
    await ops.setPermissions({ udid: UDID, bundleId: BUNDLE, permissions: { camera: 'YES' } });
    expect(argvOf(0)).toEqual(privacy('grant', 'camera'));
    await ops.setPermissions({ udid: UDID, bundleId: BUNDLE, permissions: { camera: 'NO' } });
    expect(argvOf(1)).toEqual(privacy('revoke', 'camera'));
    await ops.setPermissions({ udid: UDID, bundleId: BUNDLE, permissions: { camera: 'unset' } });
    expect(argvOf(2)).toEqual(privacy('reset', 'camera'));
  });

  it('medialibrary spells itself media-library on the simctl line (v20 parity)', async () => {
    await new SimulatorOps().setPermissions({
      udid: UDID,
      bundleId: BUNDLE,
      permissions: { medialibrary: 'YES' },
    });
    expect(argvOf(0)).toEqual(privacy('grant', 'media-library'));
  });

  it('contacts/photos ride simctl ONLY for limited (contacts-limited / photos-add)', async () => {
    const ops = new SimulatorOps();
    await ops.setPermissions({ udid: UDID, bundleId: BUNDLE, permissions: { contacts: 'limited' } });
    expect(argvOf(0)).toEqual(privacy('grant', 'contacts-limited'));
    await ops.setPermissions({ udid: UDID, bundleId: BUNDLE, permissions: { photos: 'limited' } });
    expect(argvOf(1)).toEqual(privacy('grant', 'photos-add'));
    // Any other value goes to applesimutils, exactly as v20 dispatched it.
    await ops.setPermissions({ udid: UDID, bundleId: BUNDLE, permissions: { photos: 'YES' } });
    expect(argvOf(2)).toEqual([
      'applesimutils',
      '--byId',
      UDID,
      '--bundle',
      BUNDLE,
      '--restartSB',
      '--setPermissions',
      'photos=YES',
    ]);
  });

  /**
   * @issue DTX-6125
   * One invocation per service, v20 parity: `retries: 0` is load-bearing
   * beyond the utility-timeout rule, since each invocation restarts
   * SpringBoard and a retry would restart it twice on a timing hiccup
   * nothing could observe.
   */
  it('the six applesimutils services carry --restartSB, one invocation per service', async () => {
    await new SimulatorOps().setPermissions({
      udid: UDID,
      bundleId: BUNDLE,
      permissions: { notifications: 'YES', faceid: 'NO' },
    });
    expect(execMock).toHaveBeenCalledTimes(2);
    expect(argvOf(0)).toEqual([
      'applesimutils',
      '--byId',
      UDID,
      '--bundle',
      BUNDLE,
      '--restartSB',
      '--setPermissions',
      'notifications=YES',
    ]);
    expect(argvOf(1)).toEqual([
      'applesimutils',
      '--byId',
      UDID,
      '--bundle',
      BUNDLE,
      '--restartSB',
      '--setPermissions',
      'faceid=NO',
    ]);
    expect(optsOf(0).retries).toBe(0);
    expect(optsOf(1).retries).toBe(0);
  });

  /**
   * @issue DTX-2013
   * An unknown service name and an unknown value for a known service are
   * both typed `DETOX_INVALID_ARGUMENT` refusals before anything runs —
   * closing v20's two silent holes (a fall-through service name, an
   * `undefined` value) rather than letting either reach `applesimutils`.
   */
  it("an unknown service is a typed refusal, and nothing runs — v20's fall-through hole", async () => {
    await expect(
      new SimulatorOps().setPermissions({
        udid: UDID,
        bundleId: BUNDLE,
        permissions: { frobnicator: 'YES' },
      }),
    ).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { service: 'frobnicator' },
    });
    expect(execMock).not.toHaveBeenCalled();
  });

  it("an unknown value for a known service is a typed refusal — v20's `undefined` hole", async () => {
    await expect(
      new SimulatorOps().setPermissions({
        udid: UDID,
        bundleId: BUNDLE,
        permissions: { camera: 'MAYBE' },
      }),
    ).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { service: 'camera', value: 'MAYBE' },
    });
    expect(execMock).not.toHaveBeenCalled();
  });

  /**
   * @issue DTX-6124
   * Every entry is validated before the first `setPermissions` command
   * runs, so an invalid second service can never leave the first one
   * half-applied.
   */
  it('validates EVERY entry before the first command, so a bad second key cannot half-apply', async () => {
    await expect(
      new SimulatorOps().setPermissions({
        udid: UDID,
        bundleId: BUNDLE,
        permissions: { camera: 'YES', frobnicator: 'YES' },
      }),
    ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    expect(execMock).not.toHaveBeenCalled();
  });

  /**
   * @issue DTX-6119
   * `'constructor' in SIMCTL_BASIC_ACTIONS` is true through the
   * prototype; before `Object.hasOwn`, `camera: 'constructor'`
   * stringified the Object function onto the simctl line, and
   * `photos: 'constructor'` restarted SpringBoard device-wide.
   */
  it('prototype-chain names are refusals, not commands — the wire cannot reach Object.prototype', async () => {
    const ops = new SimulatorOps();
    for (const permissions of [
      { camera: 'constructor' },
      { photos: 'constructor' },
      { toString: 'YES' },
      JSON.parse('{"__proto__":"YES"}') as Record<string, string>,
    ]) {
      await expect(
        ops.setPermissions({ udid: UDID, bundleId: BUNDLE, permissions }),
      ).rejects.toMatchObject({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    }
    expect(execMock).not.toHaveBeenCalled();
  });

  /**
   * @issue DTX-6129
   * A binary missing from PATH is an environmental fact about this
   * server, not the caller's mistake: `DETOX_INTERNAL`, naming the
   * binary and the install command (same footing as the blob lane's
   * missing `zip`).
   */
  it('a missing applesimutils binary is DETOX_INTERNAL naming the install command', async () => {
    const enoent = Object.assign(new Error('spawn applesimutils ENOENT'), { code: 'ENOENT' });
    execMock.mockRejectedValue(enoent);
    await expect(
      new SimulatorOps().setPermissions({
        udid: UDID,
        bundleId: BUNDLE,
        permissions: { notifications: 'YES' },
      }),
    ).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_INTERNAL,
      details: { binary: 'applesimutils' },
    });
  });
});

describe('launch argv composition (spec 006)', () => {
  /**
   * @issue DTX-6108
   * Launch argv ordering is the contract: user launch args first, then
   * payload argv, then the frozen `-detoxServer`/`-detoxSessionId` pair
   * last. NSUserDefaults reads the last occurrence of a repeated key, so
   * nothing appended after can be displaced by something appended before
   * it.
   * @issue DTX-6122
   * The injection env is the whole point of an instrumented launch:
   * the resolved framework rides `SIMCTL_CHILD_DYLD_INSERT_LIBRARIES`,
   * with v20's GUL guard alongside.
   */
  it('orders user args first, payload argv next, the frozen detox pair LAST', async () => {
    await new SimulatorOps().launch({
      udid: UDID,
      bundleId: BUNDLE,
      launchArgs: { mockServerPort: 9001, isHermes: true },
      languageAndLocale: { language: 'es-MX', locale: 'en_MX' },
      payloadArgs: { detoxURLOverride: 'scheme://x', detoxSourceAppOverride: 'com.example.src' },
      detox: { serverUrl: 'ws://127.0.0.1:5555/nonce', sessionId: BUNDLE, frameworkPath: '/fixed/Detox.framework/Detox' },
    });
    expect(optsOf(0).env).toEqual({
      SIMCTL_CHILD_DYLD_INSERT_LIBRARIES: '/fixed/Detox.framework/Detox',
      SIMCTL_CHILD_GULGeneratedClassDisposeDisabled: 'YES',
    });
    expect(argvOf(0)).toEqual([
      '/usr/bin/xcrun',
      'simctl',
      'launch',
      UDID,
      BUNDLE,
      '-mockServerPort',
      '9001',
      '-isHermes',
      'true',
      '-AppleLanguages',
      '(es-MX)',
      '-AppleLocale',
      'en_MX',
      '-detoxURLOverride',
      'scheme://x',
      '-detoxSourceAppOverride',
      'com.example.src',
      '-detoxServer',
      'ws://127.0.0.1:5555/nonce',
      '-detoxSessionId',
      BUNDLE,
    ]);
  });

  /**
   * @issue DTX-6128
   * `_mergeLaunchArgs` builds its map with `Object.create(null)`: on a
   * plain `{}`, a `__proto__` launch arg would hit the prototype setter
   * and be silently dropped from argv instead of landing as
   * `-__proto__` — the exact silent-discard class a typed refusal exists
   * to kill.
   */
  it('a __proto__ launch arg lands on argv instead of being silently swallowed', async () => {
    await new SimulatorOps().launch({
      udid: UDID,
      bundleId: BUNDLE,
      launchArgs: JSON.parse('{"__proto__":"seen"}') as Record<string, string>,
    });
    const argv = argvOf(0);
    expect(argv[argv.indexOf('-__proto__') + 1]).toBe('seen');
  });

  it('languageAndLocale beats a colliding user launch arg (v20 behaviour, now stated)', async () => {
    await new SimulatorOps().launch({
      udid: UDID,
      bundleId: BUNDLE,
      launchArgs: { AppleLanguages: '(en)' },
      languageAndLocale: { language: 'es' },
    });
    const argv = argvOf(0);
    // Exactly one occurrence, and it carries languageAndLocale's value.
    expect(argv.filter((token) => token === '-AppleLanguages')).toHaveLength(1);
    expect(argv[argv.indexOf('-AppleLanguages') + 1]).toBe('(es)');
  });
});

describe('resume — a foreground is not a launch transaction', () => {
  /**
   * @issue DTX-6123
   * A resume performs no new launch transaction: `simctl launch` over a
   * live process returns its identical pid and genuinely foregrounds it.
   * The argv proves it — bare `launch <udid> <bundleId>`, no launch
   * args, no detox pair, no DYLD injection env, `retries: 0` like
   * `launch`.
   */
  it('runs a bare simctl launch: no argv, no detox pair, no injection env', async () => {
    await new SimulatorOps().resume({ udid: UDID, bundleId: BUNDLE });
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(argvOf(0)).toEqual(['/usr/bin/xcrun', 'simctl', 'launch', UDID, BUNDLE]);
    const opts = optsOf(0);
    expect(opts.env).toBeUndefined();
    expect(opts.retries).toBe(0);
    expect(opts.timeout).toBeGreaterThan(0);
  });
});

describe('sendToHome keeps only wedge detectors (spec 006)', () => {
  /**
   * @issue DTX-6127
   * Both ceilings are wedge detectors, never patience limits: each child
   * either hands its message to
   * CoreSimulator in seconds or is wedged, and an unbounded child under
   * the reclaim barrier would hold `release` hostage. The launch leg
   * ran with no timeout until spec 006.
   */
  it('bounds both children — the launch leg ran with no timeout until spec 006', async () => {
    await new SimulatorOps().sendToHome({ udid: UDID });
    expect(execMock).toHaveBeenCalledTimes(2);
    expect(argvOf(0)).toEqual(['/usr/bin/xcrun', 'simctl', 'launch', UDID, 'com.apple.Preferences']);
    expect(argvOf(1)).toEqual(['/usr/bin/xcrun', 'simctl', 'terminate', UDID, 'com.apple.Preferences']);
    expect(optsOf(0).timeout).toBeGreaterThan(0);
    expect(optsOf(1).timeout).toBeGreaterThan(0);
  });
});
