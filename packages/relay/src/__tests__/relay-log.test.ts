/**
 * `RelayConnectionLog` units (spec 008): the client `$/log`
 * judge (mirrors `ConnectionRecorder.onLog`'s step branch), the replay list
 * a fresh node dial reads, the foreign-line id rewrite, and the two-gate
 * `conn` end (client gone AND every follower finished).
 */
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { describe, it, expect } from 'vitest';

import { LOG_METHOD } from '@detox-remote/protocol';
import { ConnectionLog, type LogLine } from '@detox-remote/server';

import { RelayConnectionLog, rewriteForeignLine, type RawLogFrame } from '../relay-log';

function tempFile(): string {
  return path.join(mkdtempSync(path.join(tmpdir(), 'relay-log-unit-')), 'x.jsonl');
}

function linesOf(file: string): LogLine[] {
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as LogLine);
}

function begin(id: string, kind = 'test', attrs?: Record<string, unknown>): RawLogFrame {
  return { id, phase: 'begin', kind, name: `step ${id}`, ...(attrs ? { attrs } : {}) };
}

function end(id: string, status = 'passed'): RawLogFrame {
  return { id, phase: 'end', status };
}

/** A replayed step must be a complete wire notification — a bare params object is not a frame any peer parses. */
function replayNotification(id: string, extra: Record<string, unknown> = {}): unknown {
  return { jsonrpc: '2.0', method: LOG_METHOD, params: { id, phase: 'begin', kind: 'test', name: `step ${id}`, ...extra } };
}

describe('RelayConnectionLog', () => {
  it('writes its own conn begin at construction', () => {
    const file = tempFile();
    new RelayConnectionLog(ConnectionLog.open(file), { runId: 'run-1' });
    const [line] = linesOf(file);
    expect(line).toMatchObject({ kind: 'begin', node: { id: 'conn' }, fields: { runId: 'run-1' } });
    expect(line.msg).toBeUndefined();
  });

  it('records and forwards a valid step begin/end, and closes the loop in replayFrames()', () => {
    const file = tempFile();
    const log = new RelayConnectionLog(ConnectionLog.open(file), { runId: 'run-1' });

    expect(log.onClientLog(begin('a', 'test', { retries: 1 }))).toBe(true);
    expect(log.replayFrames()).toEqual([replayNotification('a', { attrs: { retries: 1 } })]);

    expect(log.onClientLog(end('a'))).toBe(true);
    expect(log.replayFrames()).toEqual([]);

    const lines = linesOf(file);
    expect(lines[1]).toMatchObject({ kind: 'begin', node: { id: 'step:a', type: 'step', name: 'step a' } });
    expect(lines[2]).toMatchObject({ kind: 'end', node: { id: 'step:a' }, fields: { ok: true, status: 'passed' } });
  });

  it('nests a step under the currently open one, and replays in begin order', () => {
    const file = tempFile();
    const log = new RelayConnectionLog(ConnectionLog.open(file), { runId: 'run-1' });
    log.onClientLog(begin('outer'));
    log.onClientLog(begin('inner'));

    interface Notification {
      params: { id: string };
    }
    expect(log.replayFrames().map((f) => (f as Notification).params.id)).toEqual(['outer', 'inner']);
    const lines = linesOf(file);
    expect(lines.find((l) => l.node.id === 'step:inner')?.node.parent).toBe('step:outer');
  });

  it('refuses an unknown kind and a duplicate id, never forwarding either', () => {
    const file = tempFile();
    const log = new RelayConnectionLog(ConnectionLog.open(file), { runId: 'run-1' });
    expect(log.onClientLog(begin('a', 'not-a-real-kind'))).toBe(false);
    expect(log.onClientLog(begin('a'))).toBe(true);
    expect(log.onClientLog(begin('a'))).toBe(false); // duplicate id
    const warnings = linesOf(file).filter((l) => l.node.id === 'conn' && l.kind === 'log');
    expect(warnings).toHaveLength(2);
    expect(warnings[0].fields?.rejected).toBe('step');
  });

  it('refuses an end for an unknown or already-ended id, and judges the error field', () => {
    const file = tempFile();
    const log = new RelayConnectionLog(ConnectionLog.open(file), { runId: 'run-1' });
    expect(log.onClientLog(end('never-began'))).toBe(false);

    log.onClientLog(begin('a'));
    expect(log.onClientLog({ id: 'a', phase: 'end', status: 'failed', error: { name: 'Oops', message: 'bad' } })).toBe(
      true,
    );
    expect(log.onClientLog(end('a'))).toBe(false); // already ended

    const lines = linesOf(file);
    const failed = lines.find((l) => l.node.id === 'step:a' && l.kind === 'end');
    expect(failed?.fields).toMatchObject({ ok: false, status: 'failed', error: { name: 'Oops', message: 'bad' } });
  });

  it('a malformed frame (no id, or a stray phase) is a warn line under conn, never forwarded', () => {
    const file = tempFile();
    const log = new RelayConnectionLog(ConnectionLog.open(file), { runId: 'run-1' });
    expect(log.onClientLog({ phase: 'begin' })).toBe(false); // no id
    expect(log.onClientLog({ id: 'x', phase: 'bogus' })).toBe(false);
    const warnings = linesOf(file).filter((l) => l.fields?.rejected === 'step');
    expect(warnings).toHaveLength(2);
  });

  it('a plain log line is recorded under the open step (else conn) and never forwarded', () => {
    const file = tempFile();
    const log = new RelayConnectionLog(ConnectionLog.open(file), { runId: 'run-1' });
    expect(log.onClientLog({ phase: 'log', level: 'debug', msg: 'no step yet' })).toBe(false);
    log.onClientLog(begin('a'));
    expect(log.onClientLog({ phase: 'log', level: 'error', msg: 'inside a' })).toBe(false);

    const lines = linesOf(file);
    expect(lines.find((l) => l.msg === 'no step yet')).toMatchObject({ node: { id: 'conn' }, level: 'debug' });
    expect(lines.find((l) => l.msg === 'inside a')).toMatchObject({ node: { id: 'step:a' }, level: 'error' });
  });

  it('mergeForeignLine rewrites node.id/node.parent under the node name and preserves the original ts', () => {
    const file = tempFile();
    const log = new RelayConnectionLog(ConnectionLog.open(file), { runId: 'run-1' });
    log.mergeForeignLine('mac-a', {
      seq: 1,
      ts: 12345,
      level: 'info',
      kind: 'begin',
      node: { id: 'rpc:1', type: 'rpc', name: 'allocateDevice', parent: 'step:s1' },
      msg: 'allocateDevice began',
    });
    const merged = linesOf(file).find((l) => l.node.name === 'allocateDevice');
    expect(merged).toMatchObject({ ts: 12345, node: { id: 'mac-a/rpc:1', parent: 'mac-a/step:s1' } });
  });

  it('rewriteForeignLine is pure: "conn" stays the bookend name, an unparented node stays unparented', () => {
    const connLine: LogLine = { seq: 3, ts: 1, level: 'info', kind: 'end', node: { id: 'conn', type: 'server', name: 'connection' }, msg: 'x' };
    expect(rewriteForeignLine('mac-a', connLine).node).toEqual({ id: 'mac-a/conn', type: 'server', name: 'connection' });

    const rootLine: LogLine = { seq: 1, ts: 1, level: 'info', kind: 'begin', node: { id: 'rpc:1', type: 'rpc', name: 'x' } };
    expect(rewriteForeignLine('mac-a', rootLine).node).toEqual({ id: 'mac-a/rpc:1', type: 'rpc', name: 'x' });
  });

  it("the conn end waits for the client to close AND every follower to finish, force-closing any step still open", async () => {
    const file = tempFile();
    const log = new RelayConnectionLog(ConnectionLog.open(file), { runId: 'run-1' });
    log.onClientLog(begin('unfinished'));

    log.noteFollowerStarted();
    log.noteClientClosed();
    expect(linesOf(file).at(-1)?.kind).not.toBe('end'); // still waiting on the follower

    log.noteFollowerFinished();
    await log.ended;
    const last = linesOf(file).at(-1);
    expect(last).toMatchObject({ kind: 'end', node: { id: 'conn' } });
    const abandoned = linesOf(file).find((l) => l.node.id === 'step:unfinished' && l.kind === 'end');
    expect(abandoned?.fields).toMatchObject({ ok: false, status: 'aborted', reason: 'connection-closed' });
  });

  it('a session that touched no node finishes the moment the client closes', async () => {
    const file = tempFile();
    const log = new RelayConnectionLog(ConnectionLog.open(file), { runId: 'run-1' });
    log.noteClientClosed();
    await log.ended;
    expect(linesOf(file).at(-1)?.kind).toBe('end');
  });

  it('a merge after the connection finished is a defensive no-op', async () => {
    const file = tempFile();
    const log = new RelayConnectionLog(ConnectionLog.open(file), { runId: 'run-1' });
    log.noteClientClosed();
    await log.ended;
    const before = linesOf(file).length;
    log.mergeForeignLine('mac-a', { seq: 1, ts: 1, level: 'info', kind: 'log', node: { id: 'conn', type: 'server', name: 'connection' }, msg: 'late' });
    expect(linesOf(file)).toHaveLength(before);
  });

  it('noteNodeGone writes one warn line under conn, naming the node', () => {
    const file = tempFile();
    const log = new RelayConnectionLog(ConnectionLog.open(file), { runId: 'run-1' });
    log.noteNodeGone('mac-a');
    const line = linesOf(file).find((l) => l.kind === 'log' && l.node.id === 'conn');
    expect(line).toMatchObject({ level: 'warn', fields: { node: 'mac-a' } });
    expect(line?.msg).toContain('mac-a');
  });

  it('noteNodeGone after the connection finished is a defensive no-op', async () => {
    const file = tempFile();
    const log = new RelayConnectionLog(ConnectionLog.open(file), { runId: 'run-1' });
    log.noteClientClosed();
    await log.ended;
    const before = linesOf(file).length;
    log.noteNodeGone('mac-a');
    expect(linesOf(file)).toHaveLength(before);
  });
});

describe('explicit parents (spec 013)', () => {
  it('honours a parent naming an open step, replays it, and refuses one that is not — the step still lands under conn', () => {
    const file = tempFile();
    const log = new RelayConnectionLog(ConnectionLog.open(file), { runId: 'run-1' });
    expect(log.onClientLog(begin('a'))).toBe(true);
    expect(log.onClientLog(begin('b'))).toBe(true);
    // Under `a` by its word, although `b` is the most recently begun.
    expect(log.onClientLog({ ...begin('c'), parent: 'a' })).toBe(true);
    expect(log.onClientLog(end('c'))).toBe(true);
    // A parent that already ended, and one that is not a step id: refused at warn, the step under conn.
    expect(log.onClientLog({ ...begin('d'), parent: 'c' })).toBe(true);
    expect(log.onClientLog({ ...begin('e'), parent: 7 })).toBe(true);
    expect(log.onClientLog({ ...begin('f'), parent: 'nope' })).toBe(true);
    expect(log.replayFrames()).toEqual([
      replayNotification('a'),
      replayNotification('b'),
      replayNotification('d', { parent: 'c' }),
      replayNotification('e', { parent: 7 }),
      replayNotification('f', { parent: 'nope' }),
    ]);
    const lines = linesOf(file);
    expect(lines.find((l) => l.kind === 'begin' && l.node.id === 'step:c')?.node.parent).toBe('step:a');
    expect(lines.find((l) => l.kind === 'begin' && l.node.id === 'step:d')?.node.parent).toBeUndefined();
    expect(lines.find((l) => l.kind === 'begin' && l.node.id === 'step:e')?.node.parent).toBeUndefined();
    const refusals = lines.filter((l) => l.kind === 'log' && l.fields?.rejected === 'step-parent');
    expect(refusals.map((l) => ({ id: l.fields?.id, parent: l.fields?.parent, level: l.level }))).toEqual([
      { id: 'd', parent: 'c', level: 'warn' },
      { id: 'e', parent: 7, level: 'warn' },
      { id: 'f', parent: 'nope', level: 'warn' },
    ]);
  });
});

describe('a plain line with a step (spec 013)', () => {
  it('lands under the named step when open, else under the open-step rule', () => {
    const file = tempFile();
    const log = new RelayConnectionLog(ConnectionLog.open(file), { runId: 'run-1' });
    log.onClientLog(begin('a'));
    log.onClientLog(begin('b'));
    expect(log.onClientLog({ phase: 'log', level: 'info', msg: 'from a', step: 'a' })).toBe(false);
    expect(log.onClientLog({ phase: 'log', level: 'info', msg: 'ghost', step: 'nope' })).toBe(false);
    const lines = linesOf(file);
    expect(lines.find((l) => l.msg === 'from a')?.node.id).toBe('step:a');
    expect(lines.find((l) => l.msg === 'ghost')?.node.id).toBe('step:b');
  });
});
