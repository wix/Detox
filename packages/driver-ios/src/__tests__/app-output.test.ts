/**
 * The app-output capture (spec 013): a polled tail over the two files
 * `simctl launch --stdout=/--stderr=` writes, one `debug` line per output
 * line numbered per stream, partial lines carried until their newline, the
 * per-launch budget (one `warn`, then silence), `stop()` draining and
 * removing the files, and a file simctl never created tolerated.
 */
import { appendFileSync, existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

import { AppOutputCapture, appOutputPaths, ensureAppOutputDir } from '../app-output';
import type { LogLevel } from '@detox-remote/server';

interface Written {
  level: LogLevel;
  msg: string;
  fields?: Record<string, unknown>;
}

function harness(budgetBytes = 1024 * 1024) {
  const root = mkdtempSync(path.join(tmpdir(), 'detox-app-output-'));
  const paths = appOutputPaths(root, 'UDID-1', 'tok');
  ensureAppOutputDir(paths);
  const written: Written[] = [];
  const capture = new AppOutputCapture({
    paths,
    sink: { line: (level, msg, fields) => written.push({ level, msg, ...(fields ? { fields } : {}) }) },
    budgetBytes,
    pollMs: 5,
  });
  return { root, paths, written, capture };
}

const settle = (ms = 30): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

describe('appOutputPaths', () => {
  it('puts both files in the device data/tmp, named by the launch token', () => {
    const paths = appOutputPaths('/devices', 'ABC', 'tok');
    expect(paths).toEqual({ stdout: '/devices/ABC/data/tmp/detox-launch-tok.out', stderr: '/devices/ABC/data/tmp/detox-launch-tok.err' });
  });
});

describe('AppOutputCapture', () => {
  it('tails both files live, numbering lines per stream, carrying a partial line until its newline', async () => {
    const { paths, written, capture } = harness();
    capture.start(4242);
    writeFileSync(paths.stdout, 'first\nsecond\npart');
    writeFileSync(paths.stderr, 'err one\r\n');
    await settle();
    expect(written).toEqual([
      { level: 'debug', msg: 'first', fields: { stream: 'stdout', pid: 4242, line: 1 } },
      { level: 'debug', msg: 'second', fields: { stream: 'stdout', pid: 4242, line: 2 } },
      { level: 'debug', msg: 'err one', fields: { stream: 'stderr', pid: 4242, line: 1 } },
    ]);
    appendFileSync(paths.stdout, 'ial\n');
    await settle();
    expect(written.at(-1)).toEqual({ level: 'debug', msg: 'partial', fields: { stream: 'stdout', pid: 4242, line: 3 } });
    capture.stop();
    expect(existsSync(paths.stdout)).toBe(false);
    expect(existsSync(paths.stderr)).toBe(false);
  });

  it('stop() drains what is on disk before returning, then a second stop is a no-op', () => {
    const { paths, written, capture } = harness();
    capture.start(4242);
    writeFileSync(paths.stdout, 'last words\n');
    capture.stop();
    capture.stop();
    expect(written).toEqual([{ level: 'debug', msg: 'last words', fields: { stream: 'stdout', pid: 4242, line: 1 } }]);
  });

  it('past the budget: one warn naming the pid, nothing more, and the tail stops', async () => {
    const { paths, written, capture } = harness(12);
    capture.start(4242);
    writeFileSync(paths.stdout, 'tiny\n');
    await settle();
    writeFileSync(paths.stderr, 'this line is far too long\nand another\n');
    await settle();
    appendFileSync(paths.stdout, 'after the cap\n');
    await settle();
    expect(written).toEqual([
      { level: 'debug', msg: 'tiny', fields: { stream: 'stdout', pid: 4242, line: 1 } },
      { level: 'warn', msg: 'app output truncated', fields: { pid: 4242, budget: 'exhausted' } },
    ]);
    capture.stop();
  });

  it('a file simctl never created yields nothing; start after stop does not restart', async () => {
    const { written, capture } = harness();
    capture.start(4242);
    await settle();
    capture.stop();
    capture.start(4242);
    await settle();
    expect(written).toEqual([]);
  });

  it('a multi-byte character split across two writes (a mid-write poll) stays one character', async () => {
    const { paths, written, capture } = harness();
    capture.start(7);
    const euro = Buffer.from('€');
    writeFileSync(paths.stdout, Buffer.concat([Buffer.from('cost '), euro.subarray(0, 1)]));
    await settle();
    appendFileSync(paths.stdout, Buffer.concat([euro.subarray(1), Buffer.from('5\n')]));
    await settle();
    expect(written).toEqual([{ level: 'debug', msg: 'cost €5', fields: { stream: 'stdout', pid: 7, line: 1 } }]);
    capture.stop();
  });
});
