/**
 * Spec 012a's binding integration-level behaviors the accept suite does not
 * run: the lane rule clause by clause, the phases, the clamp, the hop split,
 * the metadata, and Perfetto's real requirements (every non-`M` event
 * carries `ts`, every `X` carries `dur`, both integers, none negative).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

import { toChromeTrace, parseTraceLines, hopOf, laneTid, type TraceLogLine, type TraceEvent } from '../trace';
import { describeInvocation, describeMatcher, describeRpc } from '../names';

type Partial012 = Omit<TraceLogLine, 'seq' | 'level'> & { seq?: number; level?: TraceLogLine['level'] };

/** A tiny log builder: `seq` is file order, `ts` is whatever the test says. */
function fileOf(lines: Partial012[]): TraceLogLine[] {
  return lines.map((line, index) => ({ seq: index + 1, level: 'info', ...line }));
}

function file(...lines: Partial012[]): TraceLogLine[] {
  return fileOf(lines);
}

function begin(id: string, ts: number, extra: { parent?: string; type?: string; fields?: Record<string, unknown> } = {}): Partial012 {
  return { ts, kind: 'begin', node: { id, type: extra.type ?? 'rpc', name: id, ...(extra.parent !== undefined ? { parent: extra.parent } : {}) }, ...(extra.fields ? { fields: extra.fields } : {}) };
}

function end(id: string, ts: number, extra: { fields?: Record<string, unknown>; msg?: string; level?: TraceLogLine['level'] } = {}): Partial012 {
  return { ts, kind: 'end', node: { id, type: 'rpc', name: id }, ...(extra.fields ? { fields: extra.fields } : {}), ...(extra.msg !== undefined ? { msg: extra.msg } : {}), ...(extra.level ? { level: extra.level } : {}) };
}

function log(id: string, ts: number, msg: string, fields?: Record<string, unknown>): Partial012 {
  return { ts, kind: 'log', node: { id, type: 'rpc', name: id }, msg, ...(fields ? { fields } : {}) };
}

function project(lines: TraceLogLine[]): TraceEvent[] {
  return toChromeTrace(lines, { localName: 'server' }).traceEvents;
}

interface DetoxArgs {
  id: string;
}

function slice(events: TraceEvent[], id: string): TraceEvent {
  const found = events.find((e) => (e.ph === 'X' || e.ph === 'B') && (e.args?.detox as DetoxArgs).id === id);
  if (!found) throw new Error(`no slice for ${id}`);
  return found;
}

function lanesOf(events: TraceEvent[], ...ids: string[]): number[] {
  return ids.map((id) => (slice(events, id).tid ?? 0) % 1000);
}

describe('phases', () => {
  it('projects begin + end as one X with ts and dur in microseconds and args under detox', () => {
    const events = project(file(begin('rpc:1', 1000, { fields: { method: 'boot' } }), end('rpc:1', 1250, { fields: { ok: true }, msg: 'done', level: 'warn' })));
    const x = slice(events, 'rpc:1');
    expect(x).toMatchObject({ ph: 'X', name: 'boot', cat: 'rpc', ts: 1_000_000, dur: 250_000, pid: 1, tid: laneTid(1, 1) });
    expect(x.args).toEqual({ detox: { id: 'rpc:1', level: 'warn', beginSeq: 1, endSeq: 2 }, method: 'boot', ok: true, endMsg: 'done' });
  });

  it('keeps the projection keys under args.detox so a 012 field named id cannot clobber them', () => {
    const events = project(file(begin('conn', 0), log('conn', 1, 'step refused', { rejected: 'step', id: 'client-id' }), end('conn', 2)));
    const tick = events.find((e) => e.ph === 'i');
    expect(tick?.args).toEqual({ detox: { id: 'conn', level: 'info', seq: 2 }, rejected: 'step', id: 'client-id' });
  });

  it('lets no 012 field named detox clobber the projection namespace', () => {
    const events = project(file(begin('rpc:1', 0, { fields: { detox: 'nope' } }), end('rpc:1', 1, { fields: { detox: 'still no' } }), log('rpc:1', 1, 'x', { detox: 1 })));
    expect((slice(events, 'rpc:1').args?.detox as DetoxArgs).id).toBe('rpc:1');
    expect((events.find((e) => e.ph === 'i')?.args?.detox as DetoxArgs).id).toBe('rpc:1');
  });

  it('mints no process for a foreign end whose node never began', () => {
    const events = project(file(begin('conn', 0), end('ghost/rpc:1', 5), end('conn', 9)));
    expect(events.filter((e) => e.name === 'process_name')).toHaveLength(1);
  });

  it('projects an unfinished node as a B, never an X', () => {
    const events = project(file(begin('rpc:1', 1000)));
    expect(slice(events, 'rpc:1')).toMatchObject({ ph: 'B', ts: 1_000_000 });
    expect(events.some((e) => e.ph === 'X')).toBe(false);
  });

  it('drops an end whose node never began (never a bare E)', () => {
    const events = project(file(end('rpc:9', 1000)));
    expect(events.filter((e) => e.ph !== 'M')).toEqual([]);
  });

  it('clamps a backwards clock to dur 0 and flags it', () => {
    const events = project(file(begin('rpc:1', 2000), end('rpc:1', 1500)));
    const x = slice(events, 'rpc:1');
    expect(x.dur).toBe(0);
    expect(x.args?.detox).toMatchObject({ clockWentBackwards: true });
  });

  it('projects a log line as a thread-scoped instant named by its msg, on its node\'s lane', () => {
    const events = project(file(begin('step:a', 0, { type: 'step' }), begin('rpc:1', 10, { parent: 'step:a' }), log('rpc:1', 12, 'picked udid', { udid: 'X' }), end('rpc:1', 20), end('step:a', 30)));
    const tick = events.find((e) => e.ph === 'i');
    expect(tick).toMatchObject({ name: 'picked udid', s: 't', ts: 12_000, pid: 1, tid: slice(events, 'rpc:1').tid, args: { detox: { id: 'rpc:1', level: 'info', seq: 3 }, udid: 'X' } });
  });

  it('falls back to the node name when a log line has no msg', () => {
    const events = project(file(begin('rpc:1', 0), { ts: 1, kind: 'log', node: { id: 'rpc:1', type: 'rpc', name: 'allocateDevice' } }, end('rpc:1', 2)));
    expect(events.find((e) => e.ph === 'i')?.name).toBe('allocateDevice');
  });

  it('lands a log line under a node the file never began on the process\'s lane 1', () => {
    const events = project(file(begin('rpc:1', 0), end('rpc:1', 100), begin('rpc:2', 50), end('rpc:2', 150), log('rpc:ghost', 60, 'orphan')));
    const tick = events.find((e) => e.ph === 'i');
    expect(tick?.tid).toBe(laneTid(1, 1));
    expect(events.some((e) => e.ph === 'M' && e.name === 'thread_name' && e.tid === laneTid(1, 1))).toBe(true);
  });
});

describe('the lane rule', () => {
  it('places a parent and child beginning in the same millisecond parent first, child inside', () => {
    const events = project(file(begin('step:a', 100, { type: 'step' }), begin('rpc:1', 100, { parent: 'step:a' }), end('rpc:1', 110), end('step:a', 120)));
    expect(lanesOf(events, 'step:a', 'rpc:1')).toEqual([1, 1]);
    const slices = events.filter((e) => e.ph === 'X');
    expect(slices.map((e) => e.name)).toEqual(['step:a', 'rpc:1']);
  });

  it('promotes a child that outlives its parent to another lane, keeping the lineage', () => {
    const events = project(file(begin('step:a', 0, { type: 'step' }), begin('rpc:1', 10, { parent: 'step:a' }), end('step:a', 20), end('rpc:1', 50)));
    expect(lanesOf(events, 'step:a', 'rpc:1')).toEqual([1, 2]);
    expect(slice(events, 'rpc:1').args?.detox).toMatchObject({ parent: 'step:a' });
    expect(slice(events, 'rpc:1').dur).toBe(40_000);
  });

  it('never puts two partially overlapping siblings on one lane', () => {
    const events = project(file(begin('rpc:1', 0), begin('rpc:2', 10), end('rpc:1', 20), end('rpc:2', 30)));
    expect(lanesOf(events, 'rpc:1', 'rpc:2')).toEqual([1, 2]);
  });

  it('lets two disjoint roots share one lane', () => {
    const events = project(file(begin('rpc:1', 0), end('rpc:1', 20), begin('rpc:2', 30), end('rpc:2', 40)));
    expect(lanesOf(events, 'rpc:1', 'rpc:2')).toEqual([1, 1]);
  });

  it('treats a slice ending in the millisecond the next begins as disjoint (half-open intervals)', () => {
    const events = project(file(begin('rpc:1', 0), end('rpc:1', 20), begin('rpc:2', 20), end('rpc:2', 40)));
    expect(lanesOf(events, 'rpc:1', 'rpc:2')).toEqual([1, 1]);
  });

  it('gives a zero-length node its parent\'s lane even when that lane is busy', () => {
    const events = project(file(begin('step:a', 0, { type: 'step' }), begin('rpc:1', 5, { parent: 'step:a' }), end('step:a', 10), begin('rpc:2', 7, { parent: 'step:a' }), end('rpc:2', 7), end('rpc:1', 30)));
    expect(lanesOf(events, 'step:a', 'rpc:1', 'rpc:2')).toEqual([1, 2, 1]);
  });

  it('survives a zero-length node being the first placed on a process, with a child that then outlives it', () => {
    // A backwards clock clamps the step to empty; its RPC is real. Lane 1 must exist before the RPC tries it.
    const events = project(file(begin('step:1', 10, { type: 'step' }), begin('rpc:1', 10, { parent: 'step:1' }), end('step:1', 9), end('rpc:1', 20)));
    expect(lanesOf(events, 'step:1', 'rpc:1')).toEqual([1, 1]);
    const zero = project(file(begin('rpc:0', 0), end('rpc:0', 0), begin('rpc:1', 0, { parent: 'rpc:0' }), end('rpc:1', 5)));
    expect(lanesOf(zero, 'rpc:0', 'rpc:1')).toEqual([1, 1]);
  });

  it('breaks a parent cycle instead of recursing into it, and places 100k nested steps without a stack', () => {
    const cyclic = project(file(begin('rpc:1', 0, { parent: 'rpc:2' }), begin('rpc:2', 1, { parent: 'rpc:1' }), end('rpc:2', 2), end('rpc:1', 3)));
    expect(lanesOf(cyclic, 'rpc:1', 'rpc:2')).toEqual([1, 1]);
    const depth = 100_000;
    const deep: Partial012[] = [];
    for (let i = 0; i < depth; i++) deep.push(begin(`step:${String(i)}`, i, { type: 'step', ...(i > 0 ? { parent: `step:${String(i - 1)}` } : {}) }));
    for (let i = depth - 1; i >= 0; i--) deep.push(end(`step:${String(i)}`, depth + (depth - i)));
    const started = Date.now();
    const events = project(fileOf(deep));
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(events.filter((e) => e.ph === 'X')).toHaveLength(depth);
    expect(new Set(events.filter((e) => e.ph === 'X').map((e) => e.tid)).size).toBe(1);
  });

  it('places a long sequential run in near-linear time (the fit check retires closed intervals)', () => {
    const n = 60_000;
    const lines: Partial012[] = [begin('conn', 0, { type: 'server' })];
    for (let i = 0; i < n; i++) {
      lines.push(begin(`rpc:${String(i)}`, 1 + i * 2, { parent: 'conn' }));
      lines.push(end(`rpc:${String(i)}`, 2 + i * 2));
    }
    lines.push(end('conn', 3 + n * 2));
    const started = Date.now();
    const events = project(fileOf(lines));
    expect(Date.now() - started).toBeLessThan(3_000);
    expect(new Set(events.filter((e) => e.ph === 'X').map((e) => e.tid)).size).toBe(1);
  });

  it('breaks a tie between two identical intervals by file order (the earlier begin is placed first)', () => {
    const events = project(file(begin('rpc:2', 0), begin('rpc:1', 0), end('rpc:1', 10), end('rpc:2', 10)));
    expect(lanesOf(events, 'rpc:2', 'rpc:1')).toEqual([1, 1]);
    expect(events.filter((e) => e.ph === 'X').map((e) => e.name)).toEqual(['rpc:2', 'rpc:1']);
  });

  it('gives a zero-length root lane 1', () => {
    const events = project(file(begin('rpc:1', 0), end('rpc:1', 0)));
    expect(lanesOf(events, 'rpc:1')).toEqual([1]);
  });

  it('gives an unended node a lane of its own and places no non-child after it there', () => {
    const events = project(file(begin('conn', 0, { type: 'server' }), begin('rpc:1', 10), end('rpc:1', 20), begin('rpc:2', 30), end('rpc:2', 40)));
    expect(slice(events, 'conn').ph).toBe('B');
    expect(lanesOf(events, 'conn', 'rpc:1', 'rpc:2')).toEqual([1, 2, 2]);
  });

  it('nests a declared child inside its unended parent (a live connection keeps drawing its requests inside itself)', () => {
    const events = project(file(begin('conn', 0, { type: 'server' }), begin('rpc:1', 10, { parent: 'conn' }), end('rpc:1', 20), begin('rpc:2', 30, { parent: 'conn' })));
    expect(lanesOf(events, 'conn', 'rpc:1', 'rpc:2')).toEqual([1, 1, 1]);
    const orphan = project(file(begin('conn', 0, { type: 'server' }), begin('rpc:1', 10, { parent: 'conn' }), begin('rpc:2', 30)));
    expect(lanesOf(orphan, 'conn', 'rpc:1', 'rpc:2')).toEqual([1, 1, 2]);
  });

  it('places a child whose parent the file never began as a root', () => {
    const events = project(file(begin('rpc:1', 0, { parent: 'step:missing' }), end('rpc:1', 10)));
    expect(lanesOf(events, 'rpc:1')).toEqual([1]);
  });

  it('nests a sub-operation under its request and the request under its step', () => {
    const events = project(file(
      begin('conn', 0, { type: 'server' }),
      begin('step:a', 1, { type: 'step', parent: 'conn' }),
      begin('rpc:7', 2, { parent: 'step:a' }),
      begin('rpc:7/boot', 3, { parent: 'rpc:7' }),
      end('rpc:7/boot', 8),
      end('rpc:7', 9),
      end('step:a', 10),
      end('conn', 11),
    ));
    expect(lanesOf(events, 'conn', 'step:a', 'rpc:7', 'rpc:7/boot')).toEqual([1, 1, 1, 1]);
  });

  it('allocates lanes per process and keeps tids unique across the trace', () => {
    const events = project(file(
      begin('conn', 0, { type: 'server' }),
      begin('mac-a/conn', 1, { type: 'server' }),
      begin('mac-a/rpc:1', 2),
      begin('mac-a/rpc:2', 3),
      end('mac-a/rpc:1', 5),
      end('mac-a/rpc:2', 6),
      end('mac-a/conn', 7),
      end('conn', 8),
    ));
    expect(lanesOf(events, 'conn', 'mac-a/conn', 'mac-a/rpc:1', 'mac-a/rpc:2')).toEqual([1, 1, 1, 2]);
    const tids = events.filter((e) => e.ph === 'X').map((e) => `${String(e.pid)}:${String(e.tid)}`);
    expect(slice(events, 'mac-a/rpc:2').tid).toBe(laneTid(2, 2));
    expect(new Set(events.filter((e) => e.ph === 'M' && e.name === 'thread_name').map((e) => e.tid)).size).toBe(3);
    expect(tids.every((t) => t.split(':')[1] !== t.split(':')[0])).toBe(true);
  });
});

describe('processes are hops', () => {
  it('hopOf: a sub-operation is local, a rewritten node id names its hop', () => {
    expect(hopOf('rpc:7/boot')).toBeUndefined();
    expect(hopOf('mac-a/rpc:7')).toBe('mac-a');
    expect(hopOf('conn')).toBeUndefined();
    expect(hopOf('step:abc')).toBeUndefined();
    expect(hopOf('mac-a/conn')).toBe('mac-a');
    expect(hopOf('outer/inner/rpc:7')).toBe('outer');
  });

  it('names pid 1 after localName with sort index 0 and each foreign hop after itself, in order of appearance', () => {
    const lines = file(begin('conn', 0, { type: 'server' }), begin('mac-b/conn', 1), begin('mac-a/conn', 2), end('mac-a/conn', 3), end('mac-b/conn', 4), end('conn', 5));
    const events = toChromeTrace(lines, { localName: 'relay' }).traceEvents;
    const names = events.filter((e) => e.name === 'process_name').map((e) => [e.pid, e.args?.name]);
    expect(names).toEqual([[1, 'relay'], [2, 'mac-b'], [3, 'mac-a']]);
    const sorts = events.filter((e) => e.name === 'process_sort_index').map((e) => [e.pid, e.args?.sort_index]);
    expect(sorts).toEqual([[1, 0], [2, 1], [3, 2]]);
    expect(events.filter((e) => e.name === 'thread_name').map((e) => e.args)).toEqual([{ name: 'connection' }, { name: 'connection' }, { name: 'connection' }]);
    expect(events.filter((e) => e.name === 'thread_sort_index').map((e) => e.args?.sort_index)).toEqual([1, 1, 1]);
  });
});

describe('metadata and ordering', () => {
  it('titles the trace by run id, counts the parsed lines, and omits runId when absent', () => {
    const lines = file(begin('conn', 0), end('conn', 1));
    expect(toChromeTrace(lines, { runId: 'abc', localName: 'server' }).metadata).toEqual({ runId: 'abc', title: 'detox run abc', lines: 2 });
    expect(toChromeTrace(lines, { localName: 'server' }).metadata).toEqual({ title: 'detox run', lines: 2 });
    expect(toChromeTrace([], { localName: 'server' }).metadata.title).not.toBe('');
  });

  it('emits M events first, then by ts with slices before ticks at equal ts', () => {
    const events = project(file(begin('rpc:2', 5), log('rpc:2', 5, 'tick'), end('rpc:2', 9), begin('rpc:1', 0), end('rpc:1', 1)));
    const phases = events.map((e) => e.ph);
    const firstNonM = phases.findIndex((ph) => ph !== 'M');
    expect(phases.slice(0, firstNonM).every((ph) => ph === 'M')).toBe(true);
    expect(events.slice(firstNonM).map((e) => `${e.ph}:${e.name}`)).toEqual(['X:rpc:1', 'X:rpc:2', 'i:tick']);
  });

  it('gives every non-M event an integer ts, every X an integer non-negative dur', () => {
    const events = project(file(begin('rpc:1', 0.4), log('rpc:1', 1.6, 'x'), end('rpc:1', 2.5), begin('rpc:2', 3)));
    for (const e of events.filter((e) => e.ph !== 'M')) {
      expect(Number.isInteger(e.ts)).toBe(true);
      if (e.ph === 'X') {
        expect(Number.isInteger(e.dur)).toBe(true);
        expect(e.dur).toBeGreaterThanOrEqual(0);
      }
    }
    expect(events.filter((e) => e.ph === 'M').every((e) => e.ts === undefined)).toBe(true);
  });

  it('lets end fields win over begin fields on a key collision', () => {
    const events = project(file(begin('rpc:1', 0, { fields: { status: 'begun' } }), end('rpc:1', 1, { fields: { status: 'ended' } })));
    expect(slice(events, 'rpc:1').args?.status).toBe('ended');
  });

  it('keeps the first begin and the first end of a node and ignores repeats', () => {
    const events = project(file(begin('rpc:1', 0), begin('rpc:1', 5), end('rpc:1', 10), end('rpc:1', 20)));
    expect(events.filter((e) => e.ph === 'X')).toHaveLength(1);
    expect(slice(events, 'rpc:1')).toMatchObject({ ts: 0, dur: 10_000 });
  });
});

describe('parseTraceLines', () => {
  it('skips malformed lines and blank lines, keeps well-formed ones', () => {
    const good = JSON.stringify({ seq: 1, ts: 1, level: 'info', kind: 'begin', node: { id: 'conn', type: 'server', name: 'connection' } });
    const text = [good, '', 'not json', '{"seq":"x"}', JSON.stringify({ seq: 2, ts: 2, level: 'loud', kind: 'log', node: { id: 'conn', type: 'server', name: 'c' } }), JSON.stringify({ seq: 3, ts: 3, level: 'info', kind: 'log', node: { id: 'conn' } }), JSON.stringify({ seq: 4, ts: 4, level: 'info', kind: 'log', node: { id: 'conn', type: 'server', name: 'c', parent: 1 } }), JSON.stringify({ seq: 5, ts: 5, level: 'info', kind: 'log', node: { id: 'conn', type: 'server', name: 'c' }, fields: [] }), JSON.stringify({ seq: 6, ts: 6, level: 'info', kind: 'nope', node: { id: 'conn', type: 'server', name: 'c' } }), JSON.stringify({ seq: 7, ts: 7, level: 'info', kind: 'log', node: null }), '[1]', JSON.stringify({ seq: 10, ts: 10, level: 'info', kind: 'log', node: { id: '', type: 'server', name: 'c' } }), JSON.stringify({ seq: 9, ts: 9, level: 'info', kind: 'log', node: { id: 'conn', type: 'server', name: 'c' }, msg: 123 }), JSON.stringify({ seq: 8, ts: Infinity, level: 'info', kind: 'log', node: { id: 'conn', type: 'server', name: 'c' } })].join('\n');
    const lines = parseTraceLines(text);
    expect(lines).toHaveLength(1);
    expect(lines[0].seq).toBe(1);
    expect(toChromeTrace(lines, { localName: 'server' }).metadata.lines).toBe(1);
  });
});

describe('rows are nouns', () => {
  const RESULT = { allocationId: 'alloc-1', udid: 'FD83-UDID', name: 'iPhone 17 Pro', os: 'iOS 26.0' };
  const LAUNCH = { appHandleId: 'app-1', pid: 19767 };
  const rpc = (id: string, ts: number, method: string, params: Record<string, unknown>, extra: { parent?: string } = {}): Partial012 =>
    begin(id, ts, { fields: { method, params }, ...extra });
  const rpcEnd = (id: string, ts: number, result?: Record<string, unknown>): Partial012 => end(id, ts, { fields: { ok: true, ...(result ? { result } : {}) } });

  const sanity = (): TraceLogLine[] =>
    file(
      begin('conn', 0, { type: 'server', fields: { runId: 'run-1', remoteAddress: '127.0.0.1:5000' } }),
      rpc('rpc:1', 10, 'allocateDevice', { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } }),
      begin('rpc:1/boot', 12, { parent: 'rpc:1', fields: { op: 'boot' } }),
      end('rpc:1/boot', 90, { fields: { ok: true } }),
      rpcEnd('rpc:1', 100, RESULT),
      rpc('rpc:2', 110, 'installApp', { allocationId: 'alloc-1', blob: { algo: 'sha256', hex: '2e0aa98a6a3b0dccd067' } }),
      rpcEnd('rpc:2', 150),
      rpc('rpc:3', 160, 'launchApp', { allocationId: 'alloc-1', appId: 'com.wix.example' }),
      rpcEnd('rpc:3', 200, LAUNCH),
      rpc('rpc:4', 210, 'invoke', { allocationId: 'alloc-1', appHandleId: 'app-1', invocation: { type: 'action', action: 'tap', predicate: { type: 'id', value: 'welcome', isRegex: false } } }),
      rpcEnd('rpc:4', 220),
      rpc('rpc:5', 230, 'terminateApp', { allocationId: 'alloc-1', appId: 'com.wix.example', appHandleId: 'app-1' }),
      rpcEnd('rpc:5', 240),
      rpc('rpc:6', 250, 'releaseDevice', { allocationId: 'alloc-1' }),
      rpcEnd('rpc:6', 260),
      log('conn', 265, 'a narration line'),
      end('conn', 300, { fields: { ok: true } }),
    );

  it('mints a device span (allocate → release) and an app span (launch → terminate) with human names', () => {
    const events = project(sanity());
    const device = slice(events, 'device:alloc-1#2');
    expect(device).toMatchObject({ ph: 'X', name: 'iPhone 17 Pro (FD83-UDID)', cat: 'device', ts: 10_000, dur: 250_000 });
    expect(device.args).toMatchObject({ allocationId: 'alloc-1', udid: 'FD83-UDID', detox: { id: 'device:alloc-1#2', parent: 'conn', synthetic: true } });
    const app = slice(events, 'app:app-1#8');
    expect(app).toMatchObject({ ph: 'X', name: 'com.wix.example (pid 19767)', cat: 'app', ts: 160_000, dur: 80_000 });
    expect(app.args).toMatchObject({ appHandleId: 'app-1', pid: 19767, detox: { parent: 'device:alloc-1#2', synthetic: true } });
  });

  it('names the rows after the nouns and places every rpc on its device row, the rest on the connection row', () => {
    const events = project(sanity());
    expect(events.filter((e) => e.name === 'thread_name').map((e) => e.args?.name)).toEqual(['connection', 'iPhone 17 Pro (FD83-UDID)']);
    const laneOf = (id: string): number => (slice(events, id).tid ?? 0) % 1000;
    expect(laneOf('conn')).toBe(1);
    expect(['device:alloc-1#2', 'rpc:1', 'rpc:1/boot', 'rpc:2', 'rpc:3', 'app:app-1#8', 'rpc:4', 'rpc:5', 'rpc:6'].map(laneOf)).toEqual([2, 2, 2, 2, 2, 2, 2, 2, 2]);
    const tick = events.find((e) => e.ph === 'i');
    expect(tick?.tid).toBe(laneTid(1, 1));
  });

  it('names slices for humans and keeps method/params in args, without durationMs', () => {
    const events = project(sanity());
    expect(slice(events, 'conn').name).toBe('run-1 from 127.0.0.1:5000');
    expect(slice(events, 'rpc:1').name).toBe('allocateDevice iPhone 17 Pro → FD83-UDID');
    expect(slice(events, 'rpc:2').name).toBe('installApp sha256/2e0aa98a6a3b…');
    expect(slice(events, 'rpc:3').name).toMatch(/^launchApp com\.wix\.example( → pid \d+)?$/);
    expect(slice(events, 'rpc:4').name).toBe('tap by.id("welcome")');
    expect(slice(events, 'rpc:5').name).toBe('terminateApp com.wix.example');
    expect(slice(events, 'rpc:1/boot').name).toBe('rpc:1/boot'); // a sub-operation keeps its node name (`boot` in a real file; the builder names nodes by id)
    expect(slice(events, 'rpc:4').args).toMatchObject({ method: 'invoke', ok: true });
    const withDuration = project(file(begin('rpc:1', 0), end('rpc:1', 5, { fields: { ok: true, durationMs: 5 } })));
    expect(slice(withDuration, 'rpc:1').args).not.toHaveProperty('durationMs');
  });

  it('spills an overlapping second app on the same device to "<device> +1", and an unended device is a B', () => {
    const events = project(
      file(
        begin('conn', 0, { type: 'server' }),
        rpc('rpc:1', 10, 'allocateDevice', { type: 'ios.simulator' }),
        rpcEnd('rpc:1', 20, RESULT),
        rpc('rpc:2', 30, 'launchApp', { allocationId: 'alloc-1', appId: 'a' }),
        rpcEnd('rpc:2', 40, { appHandleId: 'app-a', pid: 1 }),
        rpc('rpc:3', 50, 'launchApp', { allocationId: 'alloc-1', appId: 'b' }),
        rpcEnd('rpc:3', 60, { appHandleId: 'app-b', pid: 2 }),
        rpc('rpc:4', 70, 'terminateApp', { allocationId: 'alloc-1', appHandleId: 'app-a' }),
        rpcEnd('rpc:4', 80),
      ),
    );
    expect(events.filter((e) => e.name === 'thread_name').map((e) => e.args?.name)).toEqual(['connection', 'iPhone 17 Pro (FD83-UDID)', 'iPhone 17 Pro (FD83-UDID) +1']);
    expect(slice(events, 'device:alloc-1#2').ph).toBe('B');
    expect(slice(events, 'app:app-a#4').ph).toBe('X');
    expect(slice(events, 'app:app-b#6').ph).toBe('B');
    expect((slice(events, 'app:app-b#6').tid ?? 0) % 1000).toBe(3);
  });

  it('marks a failed node in its name, with the wire error code when there is one', () => {
    const events = project(file(rpc('rpc:1', 0, 'invoke', { invocation: { type: 'action', action: 'tap', predicate: { type: 'id', value: 'x' } } }), end('rpc:1', 5, { fields: { ok: false, error: { code: 2014, message: 'no' } } }), begin('step:a', 6, { type: 'step' }), end('step:a', 7, { fields: { ok: false, status: 'failed' } })));
    expect(slice(events, 'rpc:1').name).toBe('tap by.id("x") ✗ 2014');
    expect(slice(events, 'step:a').name).toBe('step:a ✗');
  });

  it('keeps two lives of one reused allocation id apart', () => {
    const events = project(file(
      begin('conn', 0, { type: 'server' }),
      rpc('rpc:1', 10, 'allocateDevice', { type: 'ios.simulator' }), rpcEnd('rpc:1', 20, RESULT),
      rpc('rpc:2', 30, 'releaseDevice', { allocationId: 'alloc-1' }), rpcEnd('rpc:2', 40),
      rpc('rpc:3', 50, 'allocateDevice', { type: 'ios.simulator' }), rpcEnd('rpc:3', 60, { ...RESULT, udid: 'SECOND' }),
      rpc('rpc:4', 70, 'invoke', { allocationId: 'alloc-1' }), rpcEnd('rpc:4', 80),
      end('conn', 100),
    ));
    expect(slice(events, 'device:alloc-1#2')).toMatchObject({ dur: 30_000 });
    expect(slice(events, 'device:alloc-1#6')).toMatchObject({ name: 'iPhone 17 Pro (SECOND)', dur: 50_000 });
    expect(slice(events, 'rpc:4').tid).toBe(slice(events, 'device:alloc-1#6').tid);
    expect(events.filter((e) => e.name === 'thread_name').map((e) => e.args?.name)).toEqual(['connection', 'iPhone 17 Pro (FD83-UDID)', 'iPhone 17 Pro (SECOND)']);
  });

  it('keeps a failed allocation and an unknown handle on the connection row', () => {
    const events = project(file(begin('conn', 0, { type: 'server' }), rpc('rpc:1', 10, 'allocateDevice', { type: 'ios.simulator' }), end('rpc:1', 20, { fields: { ok: false } }), rpc('rpc:2', 30, 'invoke', { allocationId: 'ghost', appHandleId: 'ghost' }), rpcEnd('rpc:2', 40), end('conn', 50)));
    expect(events.filter((e) => e.name === 'thread_name')).toHaveLength(1);
    expect(events.some((e) => e.cat === 'device')).toBe(false);
  });

  it('keys synthetic spans per hop through a relay', () => {
    const events = project(file(begin('mac-a/conn', 0, { type: 'server' }), rpc('mac-a/rpc:1', 10, 'allocateDevice', { type: 'ios.simulator' }), rpcEnd('mac-a/rpc:1', 20, RESULT), end('mac-a/conn', 50)));
    expect(slice(events, 'mac-a/device:alloc-1#2')).toMatchObject({ pid: 2, ph: 'X', dur: 40_000 });
  });
});

describe('names', () => {
  it('renders matchers the way a tester wrote them', () => {
    expect(describeMatcher({ type: 'text', value: 'Matchers', isRegex: false })).toBe('by.text("Matchers")');
    expect(describeMatcher({ type: 'id', value: '/UniqueId\\d{3}/', isRegex: true })).toBe('by.id(/UniqueId\\d{3}/)');
    expect(describeMatcher({ type: 'type', value: 'RCTImageComponentView' })).toBe('by.type("RCTImageComponentView")');
    expect(describeMatcher({ type: 'traits', value: ['button'] })).toBe('by.traits(["button"])');
    expect(describeMatcher({ type: 'and', predicates: [{ type: 'id', value: 'Grandson' }, { type: 'ancestor', predicate: { type: 'id', value: 'Son' } }] })).toBe('by.id("Grandson").withAncestor(by.id("Son"))');
    expect(describeMatcher({ type: 'and', predicates: [{ type: 'id', value: 'a' }, { type: 'text', value: 'ID' }] })).toBe('by.id("a").and(by.text("ID"))');
    expect(describeMatcher({ type: 'wat', value: 1 })).toBe('by.wat(1)');
    expect(describeMatcher(null)).toBe('?');
  });

  it('renders actions, expectations, modifiers, indices, waitFor and whileElement', () => {
    expect(describeInvocation({ type: 'action', action: 'tap', predicate: { type: 'id', value: 'x' } })).toBe('tap by.id("x")');
    expect(describeInvocation({ type: 'action', action: 'swipe', atIndex: 0, params: ['down', 'fast', 0.7, null, null], predicate: { type: 'text', value: 'Index' } })).toBe('swipe("down", "fast", 0.7) by.text("Index").atIndex(0)');
    expect(describeInvocation({ type: 'expectation', predicate: { type: 'text', value: 'x' }, expectation: 'toBeVisible' })).toBe('expect by.text("x") toBeVisible');
    expect(describeInvocation({ type: 'expectation', predicate: { type: 'id', value: 'x' }, modifiers: ['not'], expectation: 'toExist' })).toBe('expect by.id("x") not.toExist');
    expect(describeInvocation({ type: 'expectation', predicate: { type: 'text', value: 'Product' }, atIndex: 2, expectation: 'toHaveId', params: ['ProductId002'] })).toBe('expect by.text("Product").atIndex(2) toHaveId("ProductId002")');
    expect(describeInvocation({ type: 'expectation', predicate: { type: 'id', value: 'x' }, expectation: 'toBeVisible', timeout: 3000 })).toBe('waitFor by.id("x") toBeVisible within 3000ms');
    expect(describeInvocation({ type: 'action', action: 'scroll', params: [50, 'down'], predicate: { type: 'id', value: 'list' }, while: { type: 'expectation', predicate: { type: 'id', value: 'x' }, expectation: 'toBeVisible' } })).toBe('waitFor by.id("x") toBeVisible while scroll(50, "down") by.id("list")');
    expect(describeInvocation({ type: 'nope' })).toBeUndefined();
    expect(describeInvocation('x')).toBeUndefined();
  });

  it('names rpcs by their target and falls back to the method', () => {
    expect(describeRpc('allocateDevice', { type: 'ios.simulator', device: { deviceId: 'ABCD' } })).toBe('allocateDevice udid ABCD');
    expect(describeRpc('allocateDevice', { type: 'ios.simulator' })).toBe('allocateDevice ios.simulator');
    expect(describeRpc('allocateDevice', undefined)).toBe('allocateDevice');
    expect(describeRpc('installApp', { appId: 'com.x' })).toBe('installApp com.x');
    expect(describeRpc('installApp', {})).toBe('installApp');
    expect(describeRpc('uninstallApp', { appId: 'com.x' })).toBe('uninstallApp com.x');
    expect(describeRpc('reloadReactNative', { appHandleId: 'h' })).toBe('reloadReactNative');
    expect(describeRpc('invoke', { invocation: 42 })).toBe('invoke');
  });
});

// A verbatim relay recording; the recording machine's home directory in
// node-local paths is a placeholder, `/Users/operator`, not a real path.
describe('a recorded relay run of the sanity corpus (fixtures/relay-sanity.jsonl)', () => {
  const jsonl = readFileSync(path.join(__dirname, 'fixtures', 'relay-sanity.jsonl'), 'utf8');
  const trace = toChromeTrace(parseTraceLines(jsonl), { runId: 'fixture', localName: 'relay' });
  const events = trace.traceEvents;
  const rowsOf = (pid: number): string[] => events.filter((e) => e.name === 'thread_name' && e.pid === pid).map((e) => String(e.args?.name));

  it('draws the relay as pid 1 with one connection row, and the node as its own process with a device row named after the iPhone', () => {
    expect(events.filter((e) => e.name === 'process_name').map((e) => e.args?.name)).toEqual(['relay', 'mac-a']);
    expect(rowsOf(1)).toEqual(['connection']);
    expect(rowsOf(2)).toHaveLength(2);
    expect(rowsOf(2)[0]).toBe('connection');
    expect(rowsOf(2)[1]).toMatch(/^iPhone 17 Pro \([0-9A-F-]{36}\)$/);
  });

  it('nests every rpc of the node under its device and app spans on the device row, with human names', () => {
    const device = events.find((e) => e.cat === 'device');
    const app = events.find((e) => e.cat === 'app');
    expect(device?.ph).toBe('X');
    expect(app?.name).toMatch(/^com\.wix\.detox-example \(pid \d+\)$/);
    expect(app?.tid).toBe(device?.tid);
    const nodeRpcs = events.filter((e) => e.ph === 'X' && e.cat === 'rpc' && e.pid === 2);
    expect(nodeRpcs.length).toBeGreaterThan(80);
    expect(nodeRpcs.every((e) => e.tid === device?.tid)).toBe(true);
    const names = nodeRpcs.map((e) => e.name);
    expect(names).toContain('tap by.text("Matchers")');
    expect(names).toContain('expect by.text("Label Working!!!") toBeVisible');
    expect(names.some((n) => n.startsWith('allocateDevice iPhone 17 Pro'))).toBe(true);
    expect(names.some((n) => n.startsWith('launchApp com.wix.detox-example'))).toBe(true);
    expect(names.some((n) => n.startsWith('installApp sha256/'))).toBe(true);
    expect(names).not.toContain('invoke');
    expect(events.filter((e) => e.ph === 'B')).toHaveLength(0);
    expect(events.filter((e) => e.ph === 'X').every((e) => e.args?.durationMs === undefined)).toBe(true);
    expect(nodeRpcs.every((e) => e.args?.endMsg === undefined)).toBe(true);
  });

  it('names both connections by their run ids', () => {
    const conns = events.filter((e) => e.ph === 'X' && e.cat === 'server');
    expect(conns).toHaveLength(2);
    expect(conns.every((e) => /^[0-9a-f-]{36}( from .+)?$/.test(e.name))).toBe(true);
  });
});
