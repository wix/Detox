/**
 * Spec 012, the unit half: the stdout sink, the per-connection file writer,
 * the log root (lock, recovery, index, retention), the recorder over a real
 * core `Peer`, and the CLI's duration parser. The wire and HTTP half lives
 * in `connection-log.http.test.ts`.
 */
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { describe, it, expect } from 'vitest';
import { memoryChannel, Peer, DetoxError, DetoxErrorCode } from '@detox-remote/core';

import { ConnectionLog } from '../ConnectionLog';
import type { LogLine } from '../ConnectionLog';
import { ConnectionRecorder, judgeAttrs, serializeParams, summarizeResult, PARAMS_CAP_BYTES } from '../ConnectionRecorder';
import { LogStore, recoverFile, DEFAULT_LOG_ROOT } from '../LogStore';
import {
  createServerLogSink,
  describeError,
  formatStdoutLine,
  isLogLevel,
  passesLevel,
  serverLog,
  STDOUT_LINE_RE,
  type LogLevel,
} from '../log-sink';
import { parseDuration } from '../duration';
import { currentRequestTrace, type RequestTrace } from '../request-scope';

function tempRoot(prefix = 'detox-log-unit-'): string {
  return mkdtempSync(path.join(tmpdir(), prefix));
}

function linesOf(file: string): LogLine[] {
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as LogLine);
}

function collectingSink() {
  const out: string[] = [];
  const sink = createServerLogSink((chunk) => out.push(chunk));
  return { sink, out };
}

describe('the stdout sink (log-sink.ts)', () => {
  it('formats a fixed, parseable prefix and honours the threshold', () => {
    const line = formatStdoutLine(0, 'warn', 'hello');
    const match = STDOUT_LINE_RE.exec(line.trimEnd());
    expect(match?.[1]).toBe('1970-01-01T00:00:00.000Z');
    expect(match?.[2]).toBe('warn');
    expect(match?.[3]).toBe('hello');
    expect(passesLevel('error', 'warn')).toBe(true);
    expect(passesLevel('debug', 'info')).toBe(false);
    expect(isLogLevel('info')).toBe(true);
    expect(isLogLevel('loud')).toBe(false);
  });

  it('echoes at or above the level, and routes server-rank events to the attached file writer', () => {
    const { sink, out } = collectingSink();
    const file: [LogLevel, string, unknown][] = [];
    sink.attachServerFile((level, message, fields) => file.push([level, message, fields]));
    sink.setLevel('warn');
    expect(sink.level).toBe('warn');
    sink.info('quiet on stdout, loud in the file');
    sink.error('loud everywhere', { code: 1 });
    sink.warn('warned');
    sink.debug('never on stdout at warn');
    sink.echo('debug', 'echo is stdout-only');
    expect(out.join('')).toContain('[error] loud everywhere');
    expect(out.join('')).toContain('[warn] warned');
    expect(out.join('')).not.toContain('quiet on stdout');
    expect(out.join('')).not.toContain('echo is stdout-only');
    expect(file.map(([level]) => level)).toEqual(['info', 'error', 'warn', 'debug']);
    sink.attachServerFile(undefined);
    sink.info('nowhere');
    expect(file).toHaveLength(4);
    expect(describeError(new Error('boom'))).toContain('boom');
    expect(describeError('plain')).toBe('plain');
    // The process-wide singleton exists and defaults to info.
    expect(serverLog.level).toBe('info');
  });
});

describe('ConnectionLog — the file writer', () => {
  it('appends contiguous seqs synchronously and reports bytes', () => {
    const file = path.join(tempRoot(), 'c.jsonl');
    const log = ConnectionLog.open(file);
    const first = log.append({ level: 'info', kind: 'begin', node: { id: 'conn', type: 'server', name: 'connection' } });
    const second = log.append({ level: 'debug', kind: 'log', node: { id: 'conn', type: 'server', name: 'connection' }, msg: 'x' });
    expect([first?.seq, second?.seq]).toEqual([1, 2]);
    expect(log.lastSeq).toBe(2);
    expect(log.bytes).toBe(readFileSync(file).length);
    expect(linesOf(file).map((l) => l.seq)).toEqual([1, 2]);
    log.close();
    expect(log.closed).toBe(true);
    expect(log.append({ level: 'info', kind: 'log', node: { id: 'conn', type: 'server', name: 'connection' } })).toBeUndefined();
    log.close(); // idempotent
  });

  it('past the cap: one warn line with budget exhausted, then drops (no seq consumed) until a forced end', () => {
    const file = path.join(tempRoot(), 'capped.jsonl');
    const log = ConnectionLog.open(file, { capBytes: 200 });
    const node = { id: 'conn', type: 'server' as const, name: 'connection' };
    for (let i = 0; i < 10; i++) log.append({ level: 'info', kind: 'log', node, msg: `line ${String(i)} ${'x'.repeat(40)}` });
    expect(log.exhausted).toBe(true);
    const lines = linesOf(file);
    const warn = lines.find((l) => l.fields?.budget === 'exhausted');
    expect(warn?.level).toBe('warn');
    expect(lines[lines.length - 1]).toBe(warn);
    const seqBefore = log.lastSeq;
    expect(log.append({ level: 'info', kind: 'log', node, msg: 'dropped' })).toBeUndefined();
    expect(log.lastSeq).toBe(seqBefore);
    const end = log.append({ level: 'info', kind: 'end', node, fields: { ok: true } }, true);
    expect(end?.seq).toBe(seqBefore + 1);
    log.close();
  });
});

describe('LogStore — the root', () => {
  it('uses the fixed per-user location by default', () => {
    expect(DEFAULT_LOG_ROOT.endsWith(path.join('Library', 'Logs', 'detox-server'))).toBe(true);
  });

  it('refuses a second live server on the root, typed, and reuses a dead one’s socket file', async () => {
    const root = tempRoot();
    const first = await LogStore.open({ root });
    await expect(LogStore.open({ root })).rejects.toMatchObject({
      code: DetoxErrorCode.DETOX_LOG_ROOT_HELD,
      details: { root },
    });
    await first.close();
    // The socket file may linger after a death; nobody answers on it.
    writeFileSync(path.join(root, '.lock.sock'), '');
    const second = await LogStore.open({ root });
    await second.close();
  });

  it('trims a partial last line, synthesizes server-restarted ends, and indexes from the files', async () => {
    const root = tempRoot();
    const dir = path.join(root, 'runs');
    const { mkdirSync } = await import('node:fs');
    mkdirSync(dir, { recursive: true });
    const conn = { id: 'conn', type: 'server', name: 'connection' };
    // Recent timestamps: an `endedAt` from 1970 would be swept on open.
    const t0 = Date.now() - 1000;
    const complete = [
      JSON.stringify({ seq: 1, ts: t0, level: 'info', kind: 'begin', node: conn }),
      JSON.stringify({ seq: 2, ts: t0 + 1, level: 'info', kind: 'begin', node: { id: 'rpc:1', type: 'rpc', name: 'x' } }),
    ].join('\n');
    writeFileSync(path.join(dir, 'torn.jsonl'), `${complete}\n{"seq":3,"ts":1002,"lev`);
    writeFileSync(
      path.join(dir, 'ended.jsonl'),
      `${JSON.stringify({ seq: 1, ts: t0, level: 'info', kind: 'begin', node: conn })}\n${JSON.stringify({ seq: 2, ts: t0 + 2, level: 'info', kind: 'end', node: conn, fields: { ok: true } })}\n`,
    );
    writeFileSync(path.join(dir, 'garbage.jsonl'), 'no newline at all');
    writeFileSync(path.join(dir, 'not-a-log.txt'), 'ignored');

    const store = await LogStore.open({ root, retentionMs: 60_000 });
    const torn = linesOf(path.join(dir, 'torn.jsonl'));
    expect(torn.map((l) => l.seq)).toEqual([1, 2, 3]);
    expect(torn[2]).toMatchObject({ kind: 'end', node: { id: 'conn' }, fields: { ok: false, reason: 'server-restarted' } });
    expect(existsSync(path.join(dir, 'garbage.jsonl'))).toBe(false);
    const index = store.index();
    expect(index.map((r) => r.runId).sort()).toEqual(['ended', 'torn']);
    const tornRow = index.find((r) => r.runId === 'torn');
    expect(tornRow).toMatchObject({ lastSeq: 3, openHandlers: 0, startedAt: new Date(t0).toISOString() });
    expect(tornRow?.endedAt).toBeDefined();
    expect(store.has('ended')).toBe(true);
    expect(store.isLive('ended')).toBe(false);
    // recoverFile on an already-clean file changes nothing.
    expect(recoverFile(path.join(dir, 'ended.jsonl'))).toMatchObject({ lastSeq: 2, endedAt: t0 + 2, startedAt: t0 });
    await store.close();
  });

  it('sweeps ended files by retention, then by the byte budget (oldest end first, warned on the sink)', async () => {
    const root = tempRoot();
    const { sink, out } = collectingSink();
    const store = await LogStore.open({ root, retentionMs: 50, budgetBytes: 150, sink });
    const conn = { id: 'conn', type: 'server' as const, name: 'connection' };
    for (const id of ['a', 'b', 'c']) {
      const log = store.openConnection(id, () => 0);
      log.append({ level: 'info', kind: 'begin', node: conn, msg: 'x'.repeat(60) });
      log.append({ level: 'info', kind: 'end', node: conn, fields: { ok: true } });
      store.endConnection(id);
      store.endConnection(id); // idempotent
      await new Promise((r) => setTimeout(r, 2));
    }
    // Three ended files at ~150+ bytes each exceed the 150-byte budget: the
    // oldest go until it fits — before the clock reaches any of them.
    store.sweep();
    const survivors = readdirSync(path.join(root, 'runs'));
    expect(survivors.length).toBeLessThan(3);
    expect(out.join('')).toContain('log budget exceeded');
    const serverFile = readFileSync(path.join(root, 'server.jsonl'), 'utf8');
    expect(serverFile).toContain('"budget":"exceeded"');
    // Then time: everything ended is past 50 ms.
    await new Promise((r) => setTimeout(r, 60));
    expect(store.index()).toEqual([]);
    expect(readdirSync(path.join(root, 'runs'))).toEqual([]);
    await store.close();
  });

  it('never evicts a live connection, and a live row reports its handlers', async () => {
    const root = tempRoot();
    const store = await LogStore.open({ root, retentionMs: 0, budgetBytes: 1 });
    const log = store.openConnection('live', () => 2);
    log.append({ level: 'info', kind: 'begin', node: { id: 'conn', type: 'server', name: 'connection' } });
    store.sweep();
    const [row] = store.index();
    expect(row).toMatchObject({ runId: 'live', openHandlers: 2, lastSeq: 1 });
    expect(row.endedAt).toBeUndefined();
    expect(store.isLive('live')).toBe(true);
    await store.close();
    expect(log.closed).toBe(true);
    await store.close(); // idempotent
  });

  it('reads with after/level, always the final conn end, and follows a live file to its end', async () => {
    const root = tempRoot();
    const store = await LogStore.open({ root });
    const conn = { id: 'conn', type: 'server' as const, name: 'connection' };
    const log = store.openConnection('r', () => 0);
    log.append({ level: 'info', kind: 'begin', node: conn });
    log.append({ level: 'debug', kind: 'log', node: conn, msg: 'chatter' });
    log.append({ level: 'warn', kind: 'log', node: conn, msg: 'careful' });

    const collect = async (options: Parameters<LogStore['read']>[1], signal?: AbortSignal) => {
      const lines: LogLine[] = [];
      for await (const text of store.read('r', options, signal)) lines.push(JSON.parse(text) as LogLine);
      return lines;
    };
    expect((await collect({ after: 1 })).map((l) => l.seq)).toEqual([2, 3]);
    expect((await collect({ level: 'warn' })).map((l) => l.seq)).toEqual([3]);
    expect(await collect({}, AbortSignal.abort())).toEqual([]);

    const following = collect({ follow: true, level: 'error' });
    await new Promise((r) => setTimeout(r, 10));
    log.append({ level: 'error', kind: 'log', node: conn, msg: 'late' });
    log.append({ level: 'info', kind: 'end', node: conn, fields: { ok: true } });
    store.endConnection('r');
    const followed = await following;
    expect(followed.map((l) => [l.seq, l.kind])).toEqual([
      [4, 'log'],
      [5, 'end'],
    ]);
    // A follow on an ended connection returns what is there and closes.
    expect((await collect({ follow: true })).map((l) => l.seq)).toEqual([1, 2, 3, 4, 5]);
    // An unknown id yields nothing.
    const unknown: string[] = [];
    for await (const text of store.read('nope')) unknown.push(text);
    expect(unknown).toEqual([]);
    await store.close();
  });

  it('a follow waiting on a live file wakes on abort', async () => {
    const root = tempRoot();
    const store = await LogStore.open({ root });
    const log = store.openConnection('w', () => 0);
    log.append({ level: 'info', kind: 'begin', node: { id: 'conn', type: 'server', name: 'connection' } });
    const ac = new AbortController();
    const lines: string[] = [];
    const reading = (async () => {
      for await (const text of store.read('w', { follow: true }, ac.signal)) lines.push(text);
    })();
    await new Promise((r) => setTimeout(r, 10));
    ac.abort();
    await reading;
    expect(lines).toHaveLength(1);
    await store.close();
  });

  it('rotates server.jsonl at the cap into three generations', async () => {
    const root = tempRoot();
    const { sink } = collectingSink();
    const store = await LogStore.open({ root, sink, capBytes: 120 });
    for (let i = 0; i < 12; i++) sink.info(`server-rank event ${String(i)} ${'y'.repeat(50)}`);
    const files = readdirSync(root).filter((name) => name.startsWith('server'));
    expect(files.sort()).toEqual(['server.1.jsonl', 'server.2.jsonl', 'server.jsonl']);
    const current = readFileSync(path.join(root, 'server.jsonl'), 'utf8');
    expect(current).toContain('"node":{"id":"server","type":"server","name":"server"}');
    await store.close();
    sink.info('after close: the writer is detached, nothing throws');
    // Reopening continues the seq of the current generation.
    const again = await LogStore.open({ root, sink, capBytes: 120 });
    await again.close();
  });
});

describe('ConnectionRecorder — the Peer.observe seam turned into lines', () => {
  function harness(capBytes?: number) {
    const file = path.join(tempRoot(), 'rec.jsonl');
    const log = ConnectionLog.open(file, { capBytes });
    const { sink, out } = collectingSink();
    let endedCalls = 0;
    const recorder = new ConnectionRecorder({
      runId: 'abcdef12-0000',
      log,
      remoteAddress: '127.0.0.1',
      sink,
      onEnded: () => {
        endedCalls++;
      },
    });
    const [clientCh, serverCh] = memoryChannel();
    const client = Peer.create(clientCh);
    const server = Peer.create(serverCh).observe(recorder);
    // As in server.ts: the peer's close listener (registered first) aborts
    // the handlers, then the recorder closes the open sub-operations, all in
    // the same synchronous close dispatch — before any handler's catch runs.
    serverCh.onClose(() => recorder.socketClosed());
    server.onNotify({ method: '$/log', handler: (params) => recorder.onLog(params) });
    return { file, log, recorder, client, server, clientCh, out, endedCalls: () => endedCalls };
  }

  it('records rpc begin/end with params, sub-operations as children, narration under the request, and the conn node first', async () => {
    const h = harness();
    h.server.onRequest({
      method: 'allocateDevice',
      handler: async (_params, ctx) => {
        ctx.progress({ op: 'allocateDevice', kind: 'progress', message: 'looking' });
        ctx.progress({ op: 'boot', kind: 'begin', message: 'booting' });
        ctx.progress({ op: 'boot', kind: 'progress', message: 'still' });
        h.recorder.narrate(ctx.signal, 'info', 'picked udid: X');
        ctx.progress({ op: 'boot', kind: 'end', ok: true });
        ctx.progress({ op: 'boot', kind: 'end', ok: true }); // late: dropped at debug
        ctx.progress({ op: 'other', kind: 'progress', message: 'no child open for it' });
        ctx.progress('not a progress frame');
        return { udid: 'X' };
      },
    });
    await h.client.request({ method: 'allocateDevice', params: { type: 'ios.simulator', url: 'https://user:secret@host/app.zip' } });
    const lines = linesOf(h.file);
    lines.forEach((line, i) => expect(line.seq).toBe(i + 1));
    expect(lines[0]).toMatchObject({ kind: 'begin', node: { id: 'conn', type: 'server' }, fields: { remoteAddress: '127.0.0.1' } });
    const begin = lines.find((l) => l.kind === 'begin' && l.node.id === 'rpc:1');
    expect(begin).toMatchObject({ level: 'info', node: { type: 'rpc', name: 'allocateDevice' }, fields: { method: 'allocateDevice' } });
    expect(begin?.node.parent).toBeUndefined();
    expect(JSON.stringify(begin?.fields?.params)).not.toContain('secret');
    const bootBegin = lines.find((l) => l.kind === 'begin' && l.node.id === 'rpc:1/boot');
    expect(bootBegin).toMatchObject({ level: 'info', node: { parent: 'rpc:1', name: 'boot' }, fields: { op: 'boot' }, msg: 'booting' });
    const narrated = lines.find((l) => l.msg === 'picked udid: X');
    expect(narrated?.node.id).toBe('rpc:1');
    const still = lines.find((l) => l.msg === 'still');
    expect(still).toMatchObject({ level: 'debug', node: { id: 'rpc:1/boot' } });
    const bootEnd = lines.filter((l) => l.kind === 'end' && l.node.id === 'rpc:1/boot');
    expect(bootEnd).toHaveLength(1);
    expect(bootEnd[0]).toMatchObject({ level: 'info', fields: { ok: true } });
    expect(typeof bootEnd[0].fields?.durationMs).toBe('number');
    expect(lines.some((l) => l.level === 'debug' && l.fields?.late === 'end')).toBe(true);
    expect(lines.find((l) => l.msg === 'no child open for it')?.node.id).toBe('rpc:1');
    expect(lines.find((l) => l.fields?.value === 'not a progress frame')?.node.id).toBe('rpc:1');
    const end = lines.find((l) => l.kind === 'end' && l.node.id === 'rpc:1');
    expect(end).toMatchObject({ level: 'info', fields: { ok: true } });
    expect(h.out.join('')).toContain('[abcdef12] rpc:1 begin');
    expect(h.recorder.openHandlers).toBe(0);
  });

  it('a typed refusal ends at warn with the wire error verbatim; an unclassified throw at error', async () => {
    const h = harness();
    h.server.onRequest({
      method: 'refuse',
      handler: () => Promise.reject(new DetoxError('no', { code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE, details: { q: 1 } })),
    });
    h.server.onRequest({ method: 'crash', handler: () => Promise.reject(new Error('kaboom')) });
    await expect(h.client.request({ method: 'refuse' })).rejects.toBeDefined();
    await expect(h.client.request({ method: 'crash' })).rejects.toBeDefined();
    const ends = linesOf(h.file).filter((l) => l.kind === 'end' && l.node.type === 'rpc');
    expect(ends[0]).toMatchObject({ level: 'warn', fields: { ok: false, error: { code: DetoxErrorCode.DETOX_NO_MATCHING_DEVICE, message: 'no', data: { q: 1 } } } });
    expect(ends[1]).toMatchObject({ level: 'error', fields: { ok: false, error: { code: -32000, message: 'kaboom' } } });
  });

  it('steps: typed, nested by the open-step rule, ended by id in any order; the rest refused at warn', async () => {
    const h = harness();
    h.server.onRequest({ method: 'ping', handler: () => Promise.resolve('pong') });
    const step = (params: unknown) => h.client.notify({ method: '$/log', params });
    step({ id: 'A', phase: 'begin', kind: 'test', name: 'login', attrs: { n: 1, tags: ['a', 'b'], ok: true, none: null } });
    step({ id: 'B', phase: 'begin', kind: 'hook', name: 'beforeEach' });
    // Plain lines: under the open step, level and msg judged, fields verbatim (URLs redacted), non-object fields refused.
    step({ phase: 'log', level: 'warn', msg: 'slow boot', fields: { attempt: 2, url: 'https://user:pw@host/x' } });
    step({ phase: 'log', level: 'loud', msg: 7, fields: ['not', 'an', 'object'] });
    step({ id: 'A', phase: 'end', status: 'failed', error: { name: 'AssertionError', message: 'expected x' } });
    await h.client.request({ method: 'ping' });
    step({ id: 'B', phase: 'end', status: 'passed' });
    step({ id: 'B', phase: 'end', status: 'passed' }); // already ended
    step({ id: 'ghost', phase: 'end', status: 'passed' }); // unknown
    step({ id: 'bogus', phase: 'begin', kind: 'nope', name: 'x' }); // unknown kind
    step({ id: 'A', phase: 'begin', kind: 'test', name: 'reused id' }); // duplicate id
    step({ id: 'N', phase: 'begin', kind: 'step', name: 'deep', attrs: { deep: { no: true } } });
    step({ id: 'N', phase: 'end', status: 'weird', error: 'not an object' });
    step({ id: 'S', phase: 'begin', kind: 'step', name: 'skipped' });
    step({ id: 'S', phase: 'end', status: 'skipped' });
    step({ id: 'X', phase: 'begin', kind: 'step', name: 'aborted' });
    step({ id: 'X', phase: 'end', status: 'aborted', error: { name: 7, message: 8 } });
    step({ phase: 'begin' }); // malformed: no id
    step({ id: 'M', phase: 'neither' }); // malformed phase
    step(null);
    await new Promise((r) => setTimeout(r, 5));
    const lines = linesOf(h.file);
    const aBegin = lines.find((l) => l.kind === 'begin' && l.node.id === 'step:A');
    expect(aBegin).toMatchObject({ level: 'info', node: { type: 'step', name: 'login' }, fields: { kind: 'test', attrs: { n: 1, tags: ['a', 'b'], ok: true, none: null } } });
    expect(aBegin?.node.parent).toBeUndefined();
    expect(lines.find((l) => l.kind === 'begin' && l.node.id === 'step:B')?.node.parent).toBe('step:A');
    expect(lines.find((l) => l.kind === 'begin' && l.node.id === 'rpc:1')?.node.parent).toBe('step:B');
    const aEnd = lines.find((l) => l.kind === 'end' && l.node.id === 'step:A');
    expect(aEnd).toMatchObject({ level: 'error', fields: { ok: false, status: 'failed', error: { name: 'AssertionError', message: 'expected x' } } });
    expect(lines.find((l) => l.kind === 'end' && l.node.id === 'step:B')).toMatchObject({ level: 'info', fields: { ok: true, status: 'passed' } });
    const refusals = lines.filter((l) => l.kind === 'log' && l.level === 'warn' && l.node.id === 'conn');
    expect(refusals.map((l) => l.fields)).toEqual(
      expect.arrayContaining([
        { rejected: 'step-end', id: 'B' },
        { rejected: 'step-end', id: 'ghost' },
        { rejected: 'step', kind: 'nope', id: 'bogus' },
        { rejected: 'step', kind: 'test', id: 'A' },
        { rejected: 'step' },
        { rejected: 'step', id: 'M' },
      ]),
    );
    expect(lines.some((l) => l.node.id === 'step:bogus')).toBe(false);
    expect(lines.find((l) => l.kind === 'begin' && l.node.id === 'step:N')?.fields?.attrs).toEqual({ attrsRejected: true });
    expect(lines.find((l) => l.kind === 'end' && l.node.id === 'step:N')?.fields).toMatchObject({ status: 'failed' });
    expect(lines.find((l) => l.kind === 'end' && l.node.id === 'step:S')).toMatchObject({ level: 'info', fields: { ok: true, status: 'skipped' } });
    expect(lines.find((l) => l.kind === 'end' && l.node.id === 'step:X')).toMatchObject({ level: 'warn', fields: { status: 'aborted', error: { name: 'Error', message: '' } } });
    expect(lines.filter((l) => l.kind === 'begin' && l.node.id === 'step:A')).toHaveLength(1);

    const plain = lines.filter((l) => l.kind === 'log' && l.node.id === 'step:B');
    expect(plain[0]).toMatchObject({ level: 'warn', msg: 'slow boot', fields: { attempt: 2 } });
    expect(String(plain[0]?.fields?.url)).not.toContain('pw');
    expect(plain[1]).toMatchObject({ level: 'info', msg: '', fields: { fieldsRejected: true } });
  });

  it('a plain line with no open step lands on conn', async () => {
    const h = harness();
    h.client.notify({ method: '$/log', params: { phase: 'log', level: 'debug', msg: 'hi' } });
    await new Promise((r) => setTimeout(r, 5));
    expect(linesOf(h.file).find((l) => l.kind === 'log' && l.msg === 'hi')).toMatchObject({ level: 'debug', node: { id: 'conn' } });
  });

  it('a torn connection: sub-ops close at socket close, the request closes when its handler settles, LIFO, then conn', async () => {
    const h = harness();
    let release: () => void = () => undefined;
    h.server.onRequest({
      method: 'allocateDevice',
      handler: async (_params, ctx) => {
        ctx.progress({ op: 'boot', kind: 'begin' });
        await new Promise<void>((resolve) => ctx.signal.addEventListener('abort', () => resolve()));
        // The handler's own late end: dropped at debug, the synthesized one stands.
        ctx.progress({ op: 'boot', kind: 'end', ok: false });
        h.recorder.narrate(ctx.signal, 'debug', 'rolling back');
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        throw new Error('aborted');
      },
    });
    h.client.notify({ method: '$/log', params: { id: 'T', phase: 'begin', kind: 'test', name: 'open forever' } });
    const call = h.client.request({ method: 'allocateDevice' });
    await new Promise((r) => setTimeout(r, 10));
    h.clientCh.close();
    await expect(call).rejects.toThrow('Channel closed');
    h.recorder.socketClosed(); // idempotent
    let lines = linesOf(h.file);
    const bootEnd = lines.find((l) => l.kind === 'end' && l.node.id === 'rpc:1/boot');
    expect(bootEnd).toMatchObject({ level: 'warn', fields: { ok: false, reason: 'connection-closed' } });
    expect(lines.some((l) => l.kind === 'end' && l.node.id === 'rpc:1')).toBe(false);
    expect(h.recorder.openHandlers).toBe(1);
    h.recorder.reclaimed();
    expect(h.endedCalls()).toBe(0);

    release();
    await new Promise((r) => setTimeout(r, 10));
    lines = linesOf(h.file);
    const rollback = lines.find((l) => l.msg === 'rolling back');
    const rpcEnd = lines.find((l) => l.kind === 'end' && l.node.id === 'rpc:1');
    expect(rollback).toMatchObject({ level: 'debug', node: { id: 'rpc:1' } });
    expect(rpcEnd).toMatchObject({ level: 'warn', fields: { ok: false, reason: 'connection-closed', error: { code: -32800 } } });
    expect(bootEnd!.seq < rollback!.seq && rollback!.seq < rpcEnd!.seq).toBe(true);
    expect(lines.filter((l) => l.kind === 'end' && l.node.id === 'rpc:1/boot')).toHaveLength(1);
    expect(lines.some((l) => l.level === 'debug' && l.fields?.late === 'end')).toBe(true);
    const spanEnd = lines.find((l) => l.kind === 'end' && l.node.id === 'step:T');
    expect(spanEnd).toMatchObject({ level: 'warn', fields: { ok: false, status: 'aborted', reason: 'connection-closed' } });
    const last = lines[lines.length - 1];
    expect(last).toMatchObject({ kind: 'end', node: { id: 'conn' }, level: 'info', fields: { ok: true, openHandlers: 0 } });
    expect(h.endedCalls()).toBe(1);
    await h.recorder.ended;
  });

  it('a request that returns with a child still open closes the child with it (no reason on a live connection)', async () => {
    const h = harness();
    h.server.onRequest({
      method: 'sloppy',
      handler: (_params, ctx) => {
        ctx.progress({ op: 'install', kind: 'begin' });
        ctx.progress({ op: 'install', kind: 'begin' }); // began again: a log line, not a second node
        return Promise.resolve(1);
      },
    });
    await h.client.request({ method: 'sloppy' });
    const lines = linesOf(h.file);
    const childEnd = lines.find((l) => l.kind === 'end' && l.node.id === 'rpc:1/install');
    expect(childEnd?.fields?.reason).toBeUndefined();
    expect(childEnd?.seq).toBeLessThan(lines.find((l) => l.kind === 'end' && l.node.id === 'rpc:1')!.seq);
    expect(lines.filter((l) => l.kind === 'begin' && l.node.id === 'rpc:1/install')).toHaveLength(1);
  });

  it('a capped connection still ends, with budgetExhausted on the conn end', async () => {
    const h = harness(400);
    h.server.onRequest({ method: 'noisy', handler: (_p, ctx) => Promise.resolve(void ctx.progress({ op: 'noisy', kind: 'progress', message: 'z'.repeat(200) })) });
    await h.client.request({ method: 'noisy' });
    await h.client.request({ method: 'noisy' });
    expect(h.log.exhausted).toBe(true);
    h.clientCh.close();
    h.recorder.reclaimed();
    await h.recorder.ended;
    const last = linesOf(h.file).at(-1);
    expect(last).toMatchObject({ kind: 'end', node: { id: 'conn' }, fields: { budgetExhausted: true } });
    // A narration after the end is a no-op on the closed file.
    h.recorder.narrate(undefined, 'info', 'too late');
  });

  it('an allocation or launch end carries the handles its result minted, other verbs none; the auto-prose is not stored', async () => {
    const h = harness();
    h.server.onRequest({ method: 'allocateDevice', handler: () => Promise.resolve({ allocationId: 'alloc-1', device: { udid: 'UDID-1' }, name: 'iPhone 17 Pro', os: 'iOS 26.0', state: 'booted' }) });
    h.server.onRequest({ method: 'launchApp', handler: () => Promise.resolve({ appHandleId: 'app-1', pid: 4242, extra: 'not summarized' }) });
    h.server.onRequest({ method: 'invoke', handler: () => Promise.resolve({ big: 'payload' }) });
    await h.client.request({ method: 'allocateDevice', params: { type: 'ios.simulator' } });
    await h.client.request({ method: 'launchApp', params: { allocationId: 'alloc-1', appId: 'com.x' } });
    await h.client.request({ method: 'invoke', params: { appHandleId: 'app-1' } });
    const lines = linesOf(h.file);
    const endOf = (method: string): LogLine | undefined => {
      const begin = lines.find((l) => l.kind === 'begin' && l.fields?.method === method);
      return lines.find((l) => l.kind === 'end' && l.node.id === begin?.node.id);
    };
    expect(endOf('allocateDevice')?.fields?.result).toEqual({ allocationId: 'alloc-1', udid: 'UDID-1', name: 'iPhone 17 Pro', os: 'iOS 26.0' });
    expect(endOf('launchApp')?.fields?.result).toEqual({ appHandleId: 'app-1', pid: 4242 });
    expect(endOf('invoke')?.fields).not.toHaveProperty('result');
    expect(typeof endOf('invoke')?.fields?.durationMs).toBe('number');
    // The "<name> began" / "<name> ended after Nms" prose is stdout's, not the file's.
    expect(lines.filter((l) => l.node.type === 'rpc' && (l.kind === 'begin' || l.kind === 'end')).every((l) => l.msg === undefined)).toBe(true);
    expect(lines[0]).toMatchObject({ kind: 'begin', node: { id: 'conn' }, fields: { runId: h.recorder.runId } });
  });

  it('summarizeResult reads only well-typed handles', () => {
    expect(summarizeResult('allocateDevice', { allocationId: 1, device: {} })).toBeUndefined();
    expect(summarizeResult('allocateDevice', 'nope')).toBeUndefined();
    expect(summarizeResult('launchApp', { appHandleId: 'h', pid: 'x' })).toEqual({ appHandleId: 'h' });
    expect(summarizeResult('launchApp', {})).toBeUndefined();
    expect(summarizeResult('other', { anything: true })).toBeUndefined();
  });

  it('a late progress or end for a request the recorder never saw is ignored', () => {
    const h = harness();
    h.recorder.onProgress({ id: '99', value: { op: 'x', kind: 'begin' } });
    h.recorder.onRequestEnd({ id: '99', method: 'x', ok: true, durationMs: 0 });
    expect(linesOf(h.file).filter((l) => l.node.id !== 'conn')).toEqual([]);
  });
});

describe('the judges: params, attrs, durations', () => {
  it('serializes params redacted and truncates past the cap as a string prefix', () => {
    expect(serializeParams(undefined)).toEqual({});
    expect(serializeParams({ url: 'https://u:p@h/x', list: ['http://a:b@c/'], n: 1 })).toEqual({
      params: { url: expect.not.stringContaining('p@') as string, list: [expect.not.stringContaining('a:b') as string], n: 1 },
    });
    const big = serializeParams({ blob: 'x'.repeat(PARAMS_CAP_BYTES + 10) });
    expect(big.paramsTruncated).toBe(true);
    expect(typeof big.params).toBe('string');
    expect((big.params as string).length).toBe(PARAMS_CAP_BYTES);
  });

  it('judges attrs: scalars and scalar arrays pass, anything else is replaced', () => {
    expect(judgeAttrs(undefined)).toBeUndefined();
    expect(judgeAttrs({ a: 1, b: 'x', c: [1, 'y', null] })).toEqual({ a: 1, b: 'x', c: [1, 'y', null] });
    expect(judgeAttrs({ deep: { no: true } })).toEqual({ attrsRejected: true });
    expect(judgeAttrs({ arr: [{ no: true }] })).toEqual({ attrsRejected: true });
    expect(judgeAttrs('scalar')).toEqual({ attrsRejected: true });
    expect(judgeAttrs([1])).toEqual({ attrsRejected: true });
  });

  it('parses retention durations', () => {
    expect(parseDuration('10m')).toBe(600_000);
    expect(parseDuration('2h')).toBe(7_200_000);
    expect(parseDuration('1d')).toBe(86_400_000);
    expect(parseDuration('90s')).toBe(90_000);
    expect(parseDuration('500ms')).toBe(500);
    expect(parseDuration('45')).toBe(45_000);
    expect(parseDuration('0')).toBeUndefined();
    expect(parseDuration('soon')).toBeUndefined();
  });
});

describe('ConnectionRecorder — explicit parenting, spawn spans and late lines (spec 013)', () => {
  function harness(options: { childOutputBudgetBytes?: number; level?: LogLevel } = {}) {
    const file = path.join(tempRoot(), 'rec.jsonl');
    const log = ConnectionLog.open(file);
    const { sink } = collectingSink();
    if (options.level) sink.setLevel(options.level);
    const recorder = new ConnectionRecorder({ runId: 'abcdef12-0013', log, sink, onEnded: () => undefined, childOutputBudgetBytes: options.childOutputBudgetBytes });
    const [clientCh, serverCh] = memoryChannel();
    const client = Peer.create(clientCh);
    const server = Peer.create(serverCh, { handlerScope: recorder.handlerScope }).observe(recorder);
    serverCh.onClose(() => recorder.socketClosed());
    server.onNotify({ method: '$/log', handler: (params) => recorder.onLog(params) });
    return { file, recorder, client, server, clientCh };
  }

  it('a $/log begin with a parent nests there; an ended or unknown parent is refused at warn and the step lands under conn', () => {
    const h = harness();
    const step = (params: unknown) => h.recorder.onLog(params);
    step({ id: 'A', phase: 'begin', kind: 'test', name: 'a' });
    step({ id: 'B', phase: 'begin', kind: 'test', name: 'b' });
    step({ id: 'C', phase: 'begin', kind: 'step', name: 'c', parent: 'A' });
    step({ id: 'C', phase: 'end', status: 'passed' });
    step({ id: 'D', phase: 'begin', kind: 'step', name: 'd', parent: 'C' });
    step({ id: 'E', phase: 'begin', kind: 'step', name: 'e', parent: 'zzz' });
    step({ id: 'F', phase: 'begin', kind: 'step', name: 'f', parent: 42 });
    step({ id: 'G', phase: 'begin', kind: 'step', name: 'g' });
    const lines = linesOf(h.file);
    const parentOf = (id: string) => lines.find((l) => l.kind === 'begin' && l.node.id === id)?.node.parent;
    expect(parentOf('step:C')).toBe('step:A');
    expect(parentOf('step:D')).toBeUndefined();
    expect(parentOf('step:E')).toBeUndefined();
    expect(parentOf('step:F')).toBeUndefined();
    expect(parentOf('step:G')).toBe('step:F');
    const refusals = lines.filter((l) => l.kind === 'log' && l.fields?.rejected === 'step-parent');
    expect(refusals.map((l) => [l.level, l.fields?.id, l.fields?.parent])).toEqual([
      ['warn', 'D', 'C'],
      ['warn', 'E', 'zzz'],
      ['warn', 'F', 42],
    ]);
    expect(refusals[0].msg).toContain('already ended');
    expect(refusals[1].msg).toContain('unknown id');
    expect(refusals[2].msg).toContain('not a step id');
  });

  it('a request frame with a step parents there — not to the most recently begun step; an unknown step falls back with a debug line', async () => {
    const h = harness();
    h.server.onRequest({ method: 'ping', handler: () => Promise.resolve('pong') });
    h.recorder.onLog({ id: 'first', phase: 'begin', kind: 'test', name: 'first' });
    h.recorder.onLog({ id: 'second', phase: 'begin', kind: 'test', name: 'second' });
    await h.client.request({ method: 'ping', step: 'first' });
    await h.client.request({ method: 'ping', step: 'ghost' });
    await h.client.request({ method: 'ping' });
    const lines = linesOf(h.file);
    const parentOf = (id: string) => lines.find((l) => l.kind === 'begin' && l.node.id === id)?.node.parent;
    expect(parentOf('rpc:1')).toBe('step:first');
    expect(parentOf('rpc:2')).toBe('step:second');
    expect(parentOf('rpc:3')).toBe('step:second');
    const fallback = lines.find((l) => l.kind === 'log' && l.node.id === 'rpc:2' && l.fields?.step === 'ghost');
    expect(fallback?.level).toBe('debug');
  });

  it('a child spawned inside a handler is rpc:N/<tool>, a second of the same tool #2; a failed child stores its streams, a healthy one only at debug', async () => {
    const h = harness();
    h.server.onRequest({
      method: 'allocateDevice',
      handler: async () => {
        const trace = currentRequestTrace();
        expect(trace).toBeDefined();
        const listing = trace!.beginSpawn({ tool: 'applesimutils', argv: ['applesimutils', '--list', '--byId', 'X'], attempt: 1 });
        listing.end({ ok: true, exitCode: 0, stdout: '[]\n', stderr: '' });
        const again = trace!.beginSpawn({ tool: 'applesimutils', argv: ['applesimutils', '--list'], attempt: 1 });
        again.end({ ok: true, exitCode: 0, stdout: '[]', stderr: '' });
        const failed = trace!.beginSpawn({ tool: 'simctl', argv: ['/usr/bin/xcrun', 'simctl', 'boot', 'X'], attempt: 2 });
        failed.end({ ok: false, exitCode: 149, stdout: '', stderr: 'Unable to boot\r\nreason: gone\n' });
        await Promise.resolve();
        return { udid: 'X' };
      },
    });
    await h.client.request({ method: 'allocateDevice', params: { type: 'ios.simulator' } });
    const lines = linesOf(h.file);
    const first = lines.find((l) => l.kind === 'begin' && l.node.id === 'rpc:1/applesimutils');
    expect(first).toMatchObject({ node: { type: 'rpc', name: 'applesimutils', parent: 'rpc:1' }, fields: { op: 'applesimutils', argv: ['applesimutils', '--list', '--byId', 'X'], attempt: 1 } });
    expect(lines.find((l) => l.kind === 'end' && l.node.id === 'rpc:1/applesimutils')).toMatchObject({ level: 'info', fields: { ok: true, exitCode: 0, attempt: 1 } });
    expect(lines.find((l) => l.kind === 'begin' && l.node.id === 'rpc:1/applesimutils#2')).toBeDefined();
    // Healthy at the default level: no stream lines.
    expect(lines.filter((l) => l.kind === 'log' && l.node.id.startsWith('rpc:1/applesimutils'))).toEqual([]);
    const failedEnd = lines.find((l) => l.kind === 'end' && l.node.id === 'rpc:1/simctl');
    expect(failedEnd).toMatchObject({ level: 'warn', fields: { ok: false, exitCode: 149, attempt: 2 } });
    const stderrLines = lines.filter((l) => l.kind === 'log' && l.node.id === 'rpc:1/simctl');
    expect(stderrLines.map((l) => [l.level, l.msg, l.fields])).toEqual([
      ['debug', 'Unable to boot', { stream: 'stderr', line: 1 }],
      ['debug', 'reason: gone', { stream: 'stderr', line: 2 }],
    ]);
    expect(stderrLines[0].seq).toBeLessThan(failedEnd!.seq);
  });

  it('at --log-level debug a healthy child\'s stdout is stored, within the per-stream budget, then one warn', async () => {
    const h = harness({ level: 'debug', childOutputBudgetBytes: 12 });
    h.server.onRequest({
      method: 'list',
      handler: () => {
        const span = currentRequestTrace()!.beginSpawn({ tool: 'simctl', argv: ['xcrun', 'simctl', 'list'], attempt: 1 });
        span.end({ ok: true, exitCode: 0, stdout: 'one\ntwo\nthree is long\nfour\n', stderr: '' });
        return Promise.resolve(null);
      },
    });
    await h.client.request({ method: 'list' });
    const lines = linesOf(h.file).filter((l) => l.kind === 'log' && l.node.id === 'rpc:1/simctl');
    expect(lines.map((l) => [l.level, l.msg, l.fields])).toEqual([
      ['debug', 'one', { stream: 'stdout', line: 1 }],
      ['debug', 'two', { stream: 'stdout', line: 2 }],
      ['warn', 'simctl output truncated', { budget: 'exhausted', stream: 'stdout' }],
    ]);
  });

  it('a line written through the trace after the request ended still lands under the request', async () => {
    const h = harness();
    let late: RequestTrace | undefined;
    h.server.onRequest({
      method: 'launchApp',
      handler: () => {
        late = currentRequestTrace();
        return Promise.resolve({ pid: 7 });
      },
    });
    await h.client.request({ method: 'launchApp' });
    late!.line('debug', 'the app said hi', { stream: 'stdout', pid: 7, line: 1 });
    const lines = linesOf(h.file);
    const end = lines.find((l) => l.kind === 'end' && l.node.id === 'rpc:1');
    const said = lines.find((l) => l.msg === 'the app said hi');
    expect(said).toMatchObject({ node: { id: 'rpc:1' }, level: 'debug', fields: { stream: 'stdout', pid: 7, line: 1 } });
    expect(said!.seq).toBeGreaterThan(end!.seq);
  });
});

describe('ConnectionRecorder — step attribution, and a rollback\'s spawn nested under the request it compensates (spec 013)', () => {
  function harness() {
    const file = path.join(tempRoot(), 'rec.jsonl');
    const log = ConnectionLog.open(file);
    const { sink } = collectingSink();
    const recorder = new ConnectionRecorder({ runId: 'abcdef12-0014', log, sink, onEnded: () => undefined });
    const [clientCh, serverCh] = memoryChannel();
    const client = Peer.create(clientCh);
    const server = Peer.create(serverCh, { handlerScope: recorder.handlerScope }).observe(recorder);
    server.onNotify({ method: '$/log', handler: (params) => recorder.onLog(params) });
    return { file, recorder, client, server };
  }

  it('a plain log line with a step lands under that step when open, else under the open-step rule', () => {
    const h = harness();
    h.recorder.onLog({ id: 'A', phase: 'begin', kind: 'test', name: 'a' });
    h.recorder.onLog({ id: 'B', phase: 'begin', kind: 'test', name: 'b' });
    h.recorder.onLog({ phase: 'log', level: 'info', msg: 'from a', step: 'A' });
    h.recorder.onLog({ phase: 'log', level: 'info', msg: 'ambient' });
    h.recorder.onLog({ phase: 'log', level: 'info', msg: 'ghost', step: 'zzz' });
    const lines = linesOf(h.file);
    expect(lines.find((l) => l.msg === 'from a')?.node.id).toBe('step:A');
    expect(lines.find((l) => l.msg === 'ambient')?.node.id).toBe('step:B');
    expect(lines.find((l) => l.msg === 'ghost')?.node.id).toBe('step:B');
  });

  it('a spawned tool named like a progress sub-operation never overwrites it, and a rollback\'s spawn lands under the request it compensates', async () => {
    const h = harness();
    h.server.onRequest({
      method: 'allocateDevice',
      handler: (_params, ctx) => {
        ctx.progress({ op: 'boot', kind: 'begin' });
        const trace = currentRequestTrace()!;
        trace.beginSpawn({ tool: 'boot', argv: ['boot'], attempt: 1 }).end({ ok: true, exitCode: 0, stdout: '', stderr: '' });
        ctx.progress({ op: 'boot', kind: 'end', ok: true });
        ctx.onUndo(() => {
          currentRequestTrace()?.beginSpawn({ tool: 'simctl', argv: ['xcrun', 'simctl', 'shutdown'], attempt: 1 }).end({ ok: true, exitCode: 0, stdout: '', stderr: '' });
        });
        return Promise.reject(new Error('after the boot, the allocation fails'));
      },
    });
    await expect(h.client.request({ method: 'allocateDevice' })).rejects.toThrow();
    const lines = linesOf(h.file);
    const ids = lines.filter((l) => l.kind === 'begin').map((l) => l.node.id);
    expect(ids).toEqual(['conn', 'rpc:1', 'rpc:1/boot', 'rpc:1/boot#2', 'rpc:1/simctl']);
    expect(lines.filter((l) => l.kind === 'end' && l.node.id === 'rpc:1/boot')).toHaveLength(1);
    expect(lines.find((l) => l.kind === 'begin' && l.node.id === 'rpc:1/simctl')?.node.parent).toBe('rpc:1');
  });
});
