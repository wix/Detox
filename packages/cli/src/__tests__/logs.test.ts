/**
 * `detox logs` (spec 013), the unit half: its argv, the server it reads,
 * the two GETs' refusals, the views it prints, the run rows `detox test`
 * names at the end. The process shell in `main.ts` is spawn-exercised by
 * the accept suite.
 */
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

import { LOGS_HELP, parseLogsArgv } from '../logs-argv';
import { UsageError } from '../errors';
import { httpOriginOf, resolveLogsServer, type LogsServer } from '../logs-server';
import { createLogsHttp, type LogsHttp, type RunIndexRow } from '../logs-http';
import { formatIndexRow, runLogs, type LogsIo } from '../logs';
import { formatRunLines, GATED_HINT, readRunRows } from '../run-lines';

describe('parseLogsArgv', () => {
  it('reads the run id, the views, --under, --out and the config selectors', () => {
    expect(parseLogsArgv(['abc', '--all', '--under', 'inner', '-c', 'ios.sim', '-C', 'x.json'])).toEqual({
      runId: 'abc', all: true, failures: false, json: false, follow: false, under: 'inner', configuration: 'ios.sim', configPath: 'x.json', help: false,
    });
    expect(parseLogsArgv(['--json', '--out', 'f.jsonl', 'abc'])).toMatchObject({ runId: 'abc', json: true, out: 'f.jsonl' });
    expect(parseLogsArgv(['abc', '--json', '--follow'])).toMatchObject({ follow: true, json: true });
    expect(parseLogsArgv([]).runId).toBeUndefined();
    expect(parseLogsArgv(['-h'])).toMatchObject({ help: true });
    expect(parseLogsArgv(['abc', '--under=-tagged test'])).toMatchObject({ under: '-tagged test' });
    expect(() => parseLogsArgv(['abc', '--nope=1'])).toThrow(UsageError);
    expect(LOGS_HELP).toContain('--under');
  });

  it('refuses strangers, a missing value, two ids, two views, --out/--follow without --json, --follow with --under, and views without an id', () => {
    for (const tokens of [
      ['abc', '--verbose'],
      ['abc', '--under'],
      ['abc', 'def'],
      ['abc', '--all', '--failures'],
      ['abc', '--json', '--all'],
      ['abc', '--out', 'f'],
      ['abc', '--follow'],
      ['abc', '--json', '--follow', '--under', 'x'],
      ['--all'],
      ['--under', 'x'],
    ]) {
      expect(() => parseLogsArgv(tokens)).toThrow(UsageError);
    }
  });
});

function project(
  client: Record<string, unknown> | undefined,
  server?: Record<string, unknown>,
): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'detox-logs-project-'));
  writeFileSync(
    path.join(dir, '.detoxrc.json'),
    JSON.stringify({
      ...(client !== undefined ? { client } : {}),
      ...(server !== undefined ? { server } : {}),
      devices: { sim: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } },
      apps: { app: { type: 'ios.app', name: 'app', bundleId: 'com.example.app' } },
      configurations: { 'ios.sim': { device: 'sim', app: 'app' } },
    }),
  );
  return dir;
}

describe('resolveLogsServer', () => {
  it('reads client.server + token from the config, the alpha default when autostart is false, else the helper, else refuses naming client.server', async () => {
    const flags = {};
    const env = {};
    const noHelper = () => Promise.resolve(undefined);
    expect(await resolveLogsServer({ cwd: project({ server: 'ws://farm.example:9000', token: 'tkn' }), env, flags, helperAddress: noHelper })).toEqual({
      httpOrigin: 'http://farm.example:9000', token: 'tkn', source: 'config',
    });
    expect(await resolveLogsServer({ cwd: project(undefined, { autostart: false }), env, flags, helperAddress: noHelper })).toEqual({
      httpOrigin: 'http://127.0.0.1:8080', source: 'default',
    });
    expect(await resolveLogsServer({ cwd: project(undefined), env, flags, helperAddress: () => Promise.resolve({ url: 'ws://127.0.0.1:51234' }) })).toEqual({
      httpOrigin: 'http://127.0.0.1:51234', source: 'helper',
    });
    await expect(resolveLogsServer({ cwd: project(undefined), env, flags, helperAddress: noHelper })).rejects.toThrow(/client\.server/);
    expect(httpOriginOf('wss://farm.example/path?x#y')).toBe('https://farm.example');
  });
});

function response(status: number, body: string): Response {
  return new Response(body, { status, headers: { 'content-type': status === 200 ? 'application/x-ndjson' : 'text/plain' } });
}

describe('createLogsHttp', () => {
  const server: LogsServer = { httpOrigin: 'http://127.0.0.1:1', token: 'tkn', source: 'config' };

  it('GETs the index and a run with the bearer; follows with ?follow=1 and hands chunks over', async () => {
    const calls: Array<{ url: string; headers?: Record<string, string> }> = [];
    const http = createLogsHttp(server, (url, init) => {
      calls.push({ url, headers: init?.headers });
      if (url.endsWith('/v1/runs')) return Promise.resolve(response(200, JSON.stringify([{ runId: 'r', startedAt: 's', bytes: 1, lastSeq: 2, openHandlers: 0 }])));
      return Promise.resolve(response(200, '{"seq":1}\n{"seq":2}\n'));
    });
    expect(await http.index()).toEqual([{ runId: 'r', startedAt: 's', bytes: 1, lastSeq: 2, openHandlers: 0 }]);
    expect(await http.log('r')).toBe('{"seq":1}\n{"seq":2}\n');
    const chunks: string[] = [];
    expect(await http.log('r x', { follow: true, onChunk: (c) => chunks.push(c) })).toBe('{"seq":1}\n{"seq":2}\n');
    expect(chunks.join('')).toBe('{"seq":1}\n{"seq":2}\n');
    expect(calls.map((c) => c.url)).toEqual(['http://127.0.0.1:1/v1/runs', 'http://127.0.0.1:1/v1/runs/r/log', 'http://127.0.0.1:1/v1/runs/r%20x/log?follow=1']);
    expect(calls[0].headers).toEqual({ Authorization: 'Bearer tkn' });
    const open = createLogsHttp({ httpOrigin: 'http://h:1', source: 'helper' }, (_url, init) => {
      calls.push({ url: 'x', headers: init?.headers });
      return Promise.resolve(response(200, '[]'));
    });
    await open.index();
    expect(calls.at(-1)?.headers).toEqual({});
  });

  it('refuses typed, naming the server and the id: unreachable, 401, 404, 400, and any other status', async () => {
    const failing = (status: number | Error): LogsHttp =>
      createLogsHttp(server, () => (status instanceof Error ? Promise.reject(status) : Promise.resolve(response(status, 'nope'))));
    await expect(failing(new TypeError('fetch failed', { cause: new Error('ECONNREFUSED') })).index()).rejects.toThrow(/could not reach 127\.0\.0\.1:1 \(client\.server\): ECONNREFUSED/);
    await expect(failing(401).index()).rejects.toThrow(/rejected the token/);
    await expect(failing(404).log('gone')).rejects.toThrow(/no run gone on 127\.0\.0\.1:1/);
    await expect(failing(400).log('bad id')).rejects.toThrow(/not a run id/);
    await expect(failing(500).log('r')).rejects.toThrow(/answered 500/);
    await expect(failing(500).index()).rejects.toThrow(/answered 500 for \/v1\/runs/);
    await expect(failing(new Error('boom')).index()).rejects.toThrow(/boom/);
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- a non-Error rejection is the branch under test
    await expect(createLogsHttp(server, () => Promise.reject('string')).index()).rejects.toThrow(/string/);
  });

  it('dials with the real fetch when none is injected: a port nobody listens on is a typed refusal', async () => {
    await expect(createLogsHttp({ httpOrigin: 'http://127.0.0.1:1', source: 'helper' }).index()).rejects.toThrow(/could not reach 127\.0\.0\.1:1 \(the local helper\)/);
  });
});

const SANITY = [
  { seq: 1, ts: 1000, level: 'info', kind: 'begin', node: { id: 'conn', type: 'server', name: 'connection' }, fields: { runId: 'run-1' } },
  { seq: 2, ts: 1000, level: 'info', kind: 'begin', node: { id: 'step:f', type: 'step', name: 'e2e/a.test.js' }, fields: { kind: 'file' } },
  { seq: 3, ts: 1001, level: 'info', kind: 'begin', node: { id: 'step:t', type: 'step', name: 'passes', parent: 'step:f' }, fields: { kind: 'test', attrs: { fullName: 'passes' } } },
  { seq: 4, ts: 1002, level: 'info', kind: 'begin', node: { id: 'rpc:1', type: 'rpc', name: 'allocateDevice', parent: 'step:t' }, fields: { method: 'allocateDevice', params: { device: { id: 'X' } } } },
  { seq: 5, ts: 1003, level: 'debug', kind: 'log', node: { id: 'rpc:1', type: 'rpc', name: 'allocateDevice' }, msg: 'Looking' },
  { seq: 6, ts: 1010, level: 'warn', kind: 'end', node: { id: 'rpc:1', type: 'rpc', name: 'allocateDevice' }, fields: { ok: false, error: { code: 2001, message: 'none' } } },
  { seq: 7, ts: 1011, level: 'info', kind: 'end', node: { id: 'step:t', type: 'step', name: 'passes' }, fields: { ok: true, status: 'passed' } },
  { seq: 8, ts: 1012, level: 'info', kind: 'end', node: { id: 'step:f', type: 'step', name: 'e2e/a.test.js' }, fields: { ok: true, status: 'passed' } },
  { seq: 9, ts: 2000, level: 'info', kind: 'end', node: { id: 'conn', type: 'server', name: 'connection' }, fields: { ok: true } },
];
const JSONL = SANITY.map((l) => `${JSON.stringify(l)}\n`).join('');

function harness() {
  const out: string[] = [];
  const err: string[] = [];
  const files = new Map<string, string>();
  const io: LogsIo = { stdout: (t) => out.push(t), stderr: (t) => err.push(t), writeFile: (f, t) => files.set(f, t) };
  const rows: RunIndexRow[] = [{ runId: 'run-1', startedAt: '2026-08-28T00:00:00.000Z', endedAt: 'x', bytes: 9, lastSeq: 9, openHandlers: 0 }];
  const http: LogsHttp = {
    index: () => Promise.resolve(rows),
    log: (runId, options) => {
      if (runId !== 'run-1') return Promise.reject(new UsageError(`detox logs: no run ${runId} on h`));
      options?.onChunk?.(JSONL);
      return Promise.resolve(JSONL);
    },
  };
  const cwd = project({ server: 'ws://127.0.0.1:1', token: 't' });
  const run = (tokens: string[]): Promise<number> => runLogs(tokens, { cwd, env: {}, io, helperAddress: () => Promise.resolve(undefined), http: () => http });
  return { run, out, err, files };
}

describe('runLogs', () => {
  it('lists runs, prints the outline / --all / --failures / --json, narrows with --under, saves with --out', async () => {
    const h = harness();
    expect(await h.run([])).toBe(0);
    expect(h.out.at(-1)).toBe('run-1  2026-08-28T00:00:00.000Z  ended  9\n');
    expect(formatIndexRow({ runId: 'r', startedAt: 's', bytes: 0, lastSeq: 3, openHandlers: 1 })).toBe('r  s  live  3');

    expect(await h.run(['run-1'])).toBe(0);
    expect(h.out.at(-1)).toMatch(/^run run-1 · .*\ne2e\/a\.test\.js .*\n {2}passes .*\n {4}allocateDevice udid X ✗ 2001 .*\n$/);
    expect(h.out.at(-1)).not.toContain('Looking');
    expect(await h.run(['run-1', '--all'])).toBe(0);
    expect(h.out.at(-1)).toContain('      debug│ Looking');
    expect(await h.run(['run-1', '--failures'])).toBe(0);
    expect(h.out.at(-1)).toContain('error 2001: none');
    expect(await h.run(['run-1', '--json'])).toBe(0);
    expect(h.out.at(-1)).toBe(JSONL);
    expect(await h.run(['run-1', '--json', '--follow'])).toBe(0);
    expect(h.out.at(-1)).toBe(JSONL);

    expect(await h.run(['run-1', '--under', 'passes'])).toBe(0);
    expect(h.out.at(-1)?.startsWith('passes')).toBe(true);
    expect(await h.run(['run-1', '--under', 'allocateDevice', '--json'])).toBe(0);
    expect(h.out.at(-1)).toBe(SANITY.slice(3, 6).map((l) => `${JSON.stringify(l)}\n`).join(''));
    expect(await h.run(['run-1', '--under', 'passes', '--failures'])).toBe(0);
    expect(h.out.at(-1)).toMatch(/^passes .*\n {2}allocateDevice udid X ✗ 2001/);

    expect(await h.run(['run-1', '--json', '--out', 'saved.jsonl'])).toBe(0);
    expect(h.files.get('saved.jsonl')).toBe(JSONL);
    expect(h.out.at(-1)).toBe('wrote 9 lines of run run-1 to saved.jsonl\n');
    expect(await h.run(['run-1', '--json', '--out', 'sub.jsonl', '--under', 'passes'])).toBe(0);
    expect(h.files.get('sub.jsonl')?.split('\n').filter(Boolean)).toHaveLength(5);
    expect(await h.run(['--help'])).toBe(0);
    expect(h.out.at(-1)).toContain('detox logs');
  });

  it('several --under matches print each subtree under a heading', async () => {
    const h = harness();
    expect(await h.run(['run-1', '--under', 'conn'])).toBe(0);
    expect(await h.run(['run-1', '--under', 'e2e/a.test.js'])).toBe(0);
    const twice = JSONL + JSONL.replaceAll('step:f', 'step:g').replaceAll('step:t', 'step:u').replaceAll('rpc:1', 'rpc:2');
    const io: LogsIo = { stdout: (t) => h.out.push(t), stderr: () => undefined, writeFile: () => undefined };
    const cwd = project({ server: 'ws://127.0.0.1:1' });
    const code = await runLogs(['run-1', '--under', 'passes'], {
      cwd, env: {}, io, helperAddress: () => Promise.resolve(undefined),
      http: () => ({ index: () => Promise.resolve([]), log: () => Promise.resolve(twice) }),
    });
    expect(code).toBe(0);
    const text = h.out.at(-1) ?? '';
    expect(text).toContain('── passes · match 1 of 2 · step:t ──');
    expect(text).toContain('── passes · match 2 of 2 · step:u ──');
  });

  it('refuses on one line with exit 2: an unknown run, an unmatched --under, a bad flag, no config', async () => {
    const h = harness();
    expect(await h.run(['no-such-run'])).toBe(2);
    expect(h.err.at(-1)).toBe('detox logs: no run no-such-run on h\n');
    expect(await h.run(['run-1', '--under', 'nothing-here'])).toBe(2);
    expect(h.err.at(-1)).toContain('nothing named "nothing-here" in run run-1');
    expect(await h.run(['run-1', '--nope'])).toBe(2);
    expect(h.err.at(-1)).toContain('--nope');
    const empty = mkdtempSync(path.join(tmpdir(), 'detox-logs-empty-'));
    const err: string[] = [];
    const code = await runLogs(['run-1'], { cwd: empty, env: {}, io: { stdout: () => undefined, stderr: (t) => err.push(t), writeFile: () => undefined }, helperAddress: () => Promise.resolve(undefined) });
    expect(code).toBe(2);
    expect(err.join('')).not.toContain('    at ');
    await expect(runLogs(['run-1'], { cwd: h ? project({ server: 'ws://127.0.0.1:1' }) : '', env: {}, io: { stdout: () => undefined, stderr: () => undefined, writeFile: () => undefined }, helperAddress: () => Promise.resolve(undefined), http: () => ({ index: () => Promise.resolve([]), log: () => Promise.reject(new Error('unexpected')) }) })).rejects.toThrow('unexpected');
  });
});

describe('the run lines detox test prints last', () => {
  it('reads every worker\'s rows beside the snapshot and prints one line each, the gated hint once', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'detox-run-lines-'));
    const snapshotPath = path.join(dir, 'config-snapshot.json');
    expect(readRunRows(snapshotPath)).toEqual([]);
    mkdirSync(path.join(dir, 'runs'));
    writeFileSync(path.join(dir, 'runs', '20.jsonl'), `${JSON.stringify({ runId: 'b', serverUrl: 'ws://h:1', viewerUrl: 'http://h:1/v1/runs/b/perfetto', gated: true })}\n{"half":\n`);
    writeFileSync(path.join(dir, 'runs', '3.jsonl'), `${JSON.stringify({ runId: 'a', serverUrl: 'ws://h:1', viewerUrl: 'http://h:1/v1/runs/a/perfetto', gated: true })}\n${JSON.stringify({ nope: 1 })}\n`);
    writeFileSync(path.join(dir, 'runs', 'notes.txt'), 'ignored');
    const rows = readRunRows(snapshotPath);
    expect(rows.map((r) => r.runId)).toEqual(['a', 'b']);
    expect(formatRunLines(rows)).toEqual([
      `detox run a → http://h:1/v1/runs/a/perfetto ${GATED_HINT}`,
      'detox run b → http://h:1/v1/runs/b/perfetto',
    ]);
    expect(formatRunLines([{ runId: 'c', serverUrl: 'ws://h:1', viewerUrl: 'u', gated: false }])).toEqual(['detox run c → u']);
    expect(readFileSync(path.join(dir, 'runs', '3.jsonl'), 'utf8')).toContain('"nope"');
  });
});
