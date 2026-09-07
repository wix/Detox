/**
 * The request scope (spec 013): the tool-name rule, the server-rank
 * fallback trace (lines through the process sink), and the scope lookup.
 */
import { describe, it, expect, afterEach } from 'vitest';

import { serverLog, type LogLevel } from '../log-sink';
import { currentRequestTrace, requestScope, serverRankTrace, spawnTrace, toolNameOf, type RequestTrace } from '../request-scope';

describe('toolNameOf', () => {
  it('names an xcrun child by its subcommand and anything else by its basename', () => {
    expect(toolNameOf('/usr/bin/xcrun', ['simctl', 'list'])).toBe('simctl');
    expect(toolNameOf('xcrun', [])).toBe('xcrun');
    expect(toolNameOf('applesimutils', ['--list'])).toBe('applesimutils');
    expect(toolNameOf('/usr/bin/ditto', ['-x'])).toBe('ditto');
    expect(toolNameOf('/usr/bin/xcrun', ['--find', 'clang'])).toBe('xcrun');
  });
});

describe('the scope', () => {
  it('finds the request trace inside run and falls back to the server-rank trace outside', async () => {
    const fake: RequestTrace = { beginSpawn: () => ({ end: () => undefined }), line: () => undefined };
    expect(currentRequestTrace()).toBeUndefined();
    expect(spawnTrace()).toBe(serverRankTrace);
    await requestScope.run(fake, async () => {
      await Promise.resolve();
      expect(currentRequestTrace()).toBe(fake);
      expect(spawnTrace()).toBe(fake);
    });
    expect(currentRequestTrace()).toBeUndefined();
  });
});

describe('the server-rank trace', () => {
  const written: Array<[LogLevel, string, Record<string, unknown> | undefined]> = [];
  afterEach(() => {
    serverLog.attachServerFile(undefined);
    written.length = 0;
  });

  it('writes a spawn as debug begin/end lines, a failure at warn with the stderr tail, and plain lines at their level', () => {
    serverLog.attachServerFile((level, message, fields) => written.push([level, message, fields]));
    const ok = serverRankTrace.beginSpawn({ tool: 'simctl', argv: ['xcrun', 'simctl', 'list'], attempt: 1 });
    ok.end({ ok: true, exitCode: 0, stdout: '{}', stderr: '' });
    const bad = serverRankTrace.beginSpawn({ tool: 'ditto', argv: ['ditto'], attempt: 2 });
    bad.end({ ok: false, exitCode: 1, signal: undefined, stdout: '', stderr: 'first\nsecond\n' });
    const dead = serverRankTrace.beginSpawn({ tool: 'nope', argv: ['nope'], attempt: 1 });
    dead.end({ ok: false, error: { name: 'ENOENT', message: 'spawn nope ENOENT' }, stdout: '', stderr: '' });
    serverRankTrace.line('info', 'plain', { a: 1 });

    expect(written[0]).toEqual(['debug', 'spawn simctl', { op: 'simctl', argv: ['xcrun', 'simctl', 'list'], attempt: 1 }]);
    expect(written[1][0]).toBe('debug');
    expect(written[1][2]).toMatchObject({ op: 'simctl', ok: true, exitCode: 0, attempt: 1 });
    expect(typeof written[1][2]?.durationMs).toBe('number');
    expect(written[3][0]).toBe('warn');
    expect(written[3][1]).toContain('first\nsecond');
    expect(written[3][2]).toMatchObject({ op: 'ditto', ok: false, exitCode: 1, attempt: 2 });
    expect(written[5][2]).toMatchObject({ op: 'nope', ok: false, error: { name: 'ENOENT', message: 'spawn nope ENOENT' } });
    expect(written[6]).toEqual(['info', 'plain', { a: 1 }]);
  });
});
