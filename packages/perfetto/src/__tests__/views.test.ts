/**
 * Spec 013's binding text views, unit-pinned: the declared tree, the
 * outline (depth, durations, `✗`, collapsing, `--all` ticks, headings and
 * hop sections), the failure cut (innermost failed nodes, ancestors, the
 * error, the ticks around it — 11 code-2014 blocks on the 012a fixture),
 * and `--under` selection by name, fullName, rpc name or method, and id.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

import { parseTraceLines, type TraceLogLine } from '../trace';
import { ancestryOf, buildTree, subtreeLines } from '../tree';
import { toOutline } from '../outline';
import { errorLinesOf, innermostFailures, ticksAround, toFailures } from '../failures';
import { matchesUnder, selectUnder } from '../subtree';
import { formatDuration, layoutColumns, plainNameOf } from '../format';

type Partial012 = Omit<TraceLogLine, 'seq' | 'level'> & { seq?: number; level?: TraceLogLine['level'] };

function file(...lines: Partial012[]): TraceLogLine[] {
  return lines.map((line, index) => ({ seq: index + 1, level: 'info', ...line }));
}

interface NodeSpec {
  type?: string;
  name?: string;
  parent?: string;
  fields?: Record<string, unknown>;
}

function begin(id: string, ts: number, spec: NodeSpec = {}): Partial012 {
  return {
    ts,
    kind: 'begin',
    node: { id, type: spec.type ?? 'rpc', name: spec.name ?? id, ...(spec.parent !== undefined ? { parent: spec.parent } : {}) },
    ...(spec.fields ? { fields: spec.fields } : {}),
  };
}

function end(id: string, ts: number, fields: Record<string, unknown> = { ok: true }, msg?: string): Partial012 {
  return { ts, kind: 'end', node: { id, type: 'rpc', name: id }, fields, ...(msg !== undefined ? { msg } : {}) };
}

function log(id: string, ts: number, msg: string, extra: { level?: TraceLogLine['level']; fields?: Record<string, unknown> } = {}): Partial012 {
  return { ts, kind: 'log', node: { id, type: 'rpc', name: id }, msg, ...(extra.level ? { level: extra.level } : {}), ...(extra.fields ? { fields: extra.fields } : {}) };
}

function step(id: string, ts: number, kind: string, name: string, parent?: string, attrs?: Record<string, unknown>): Partial012 {
  return begin(id, ts, { type: 'step', name, parent, fields: { kind, ...(attrs ? { attrs } : {}) } });
}

/** A jest-shaped run: conn › file › describe › (hook, test › rpc, failed test, skipped). */
function sanityRun(): TraceLogLine[] {
  return file(
    begin('conn', 1000, { type: 'server', name: 'connection', fields: { runId: 'run-1', remoteAddress: '127.0.0.1:5' } }),
    step('step:f', 1000, 'file', 'e2e/sanity.test.js', undefined, { filePath: 'e2e/sanity.test.js' }),
    begin('rpc:1', 1001, { name: 'allocateDevice', parent: 'step:f', fields: { method: 'allocateDevice', params: { type: 'ios.simulator', device: { type: 'iPhone 17 Pro' } } } }),
    log('rpc:1', 1002, 'allocateDevice — query: {}', { level: 'info' }),
    end('rpc:1', 1400, { ok: true, result: { allocationId: 'alloc-1', udid: 'U', name: 'iPhone 17 Pro' } }),
    step('step:s', 1400, 'describe', 'Sanity', 'step:f', { fullName: 'Sanity' }),
    step('step:h', 1400, 'hook', 'beforeAll', 'step:s', { hookType: 'beforeAll' }),
    end('step:h', 1401, { ok: true, status: 'passed' }),
    step('step:i', 1401, 'describe', 'inner', 'step:s', { fullName: 'Sanity inner' }),
    step('step:p', 1402, 'test', 'passes', 'step:i', { fullName: 'Sanity inner passes', filePath: 'e2e/sanity.test.js', invocation: 1 }),
    begin('rpc:2', 1403, { name: 'allocateDevice', parent: 'step:p', fields: { method: 'allocateDevice', params: { type: 'ios.simulator', device: { id: '0000' } } } }),
    log('rpc:2', 1404, 'Looking for a matching device', { level: 'debug' }),
    end('rpc:2', 1500, { ok: false, error: { code: 2001, message: 'no device matches' } }),
    end('step:p', 1501, { ok: true, status: 'passed' }),
    step('step:q', 1501, 'test', 'fails', 'step:i', { fullName: 'Sanity inner fails', filePath: 'e2e/sanity.test.js', invocation: 1 }),
    end('step:q', 1504, { ok: false, status: 'failed', error: { name: 'Error', message: 'expect(received).toBe(expected)\n\nExpected: 2\nReceived: 1' } }),
    step('step:k', 1504, 'test', 'skipped', 'step:i', { fullName: 'Sanity inner skipped', filePath: 'e2e/sanity.test.js', invocation: 1 }),
    end('step:k', 1504, { ok: true, status: 'skipped' }),
    end('step:i', 1505, { ok: false, status: 'failed' }),
    end('step:s', 1505, { ok: false, status: 'failed' }),
    end('step:f', 1506, { ok: false, status: 'failed' }),
    end('conn', 9000, { ok: true }),
  );
}

const lines = (text: string): string[] => text.split('\n').filter((l) => l.length > 0);
const at = (rows: string[], prefix: string): number => rows.findIndex((l) => l.trimStart().startsWith(prefix));
const indent = (row: string): number => row.length - row.trimStart().length;

describe('buildTree', () => {
  it('declares parents from begin lines, orders children by seq, and keeps orphans as roots', () => {
    const tree = buildTree(sanityRun());
    expect(tree.roots.map((r) => r.id)).toEqual(['conn', 'step:f']);
    const inner = tree.nodes.get('step:i');
    expect(inner?.children.map((c) => c.id)).toEqual(['step:p', 'step:q', 'step:k']);
    expect(ancestryOf(tree.nodes.get('rpc:2')!).map((n) => n.id)).toEqual(['step:f', 'step:s', 'step:i', 'step:p', 'rpc:2']);
    expect(subtreeLines(sanityRun(), inner!).map((l) => l.node.id)).toEqual(['step:i', 'step:p', 'rpc:2', 'rpc:2', 'rpc:2', 'step:p', 'step:q', 'step:q', 'step:k', 'step:k', 'step:i']);
    const orphan = buildTree(file(begin('rpc:9', 1, { parent: 'step:ghost' }), log('rpc:7', 2, 'x')));
    expect(orphan.roots.map((r) => r.id)).toEqual(['rpc:9', 'rpc:7']);
  });
});

describe('toOutline', () => {
  it('prints the run heading, the tree at growing depth with a right-aligned duration column, ✗ on failures, no ticks', () => {
    const out = lines(toOutline(sanityRun(), { runId: 'run-1' }));
    expect(out[0]).toBe('run run-1 from 127.0.0.1:5 · 1970-01-01T00:00:01.000Z · 8.0 s');
    expect(indent(out[at(out, 'e2e/sanity.test.js')])).toBe(0);
    expect(indent(out[at(out, 'allocateDevice iPhone 17 Pro')])).toBe(2);
    expect(indent(out[at(out, 'Sanity')])).toBe(2);
    expect(indent(out[at(out, 'beforeAll')])).toBe(4);
    expect(indent(out[at(out, 'inner')])).toBe(4);
    expect(indent(out[at(out, 'passes')])).toBe(6);
    expect(indent(out[at(out, 'allocateDevice udid 0000')])).toBe(8);
    expect(out[at(out, 'allocateDevice udid 0000')]).toMatch(/allocateDevice udid 0000 ✗ 2001\s+97 ms$/);
    expect(out[at(out, 'fails')]).toMatch(/fails ✗\s+3 ms$/);
    expect(out[at(out, 'skipped')]).toMatch(/skipped\s+0 ms$/);
    expect(out[at(out, 'e2e/sanity.test.js')]).toMatch(/e2e\/sanity\.test\.js ✗\s+506 ms$/);
    const durations = out.slice(1).map((l) => l.length);
    expect(new Set(durations).size).toBe(1);
    expect(out.some((l) => l.includes('Looking for a matching device'))).toBe(false);
    expect(out.some((l) => l.includes('connection'))).toBe(false);
  });

  it('--all prints ticks under their node as level│ (stream│ for a stream line), and an open node as … (open)', () => {
    const run = file(
      begin('conn', 0, { type: 'server', name: 'connection', fields: { runId: 'r' } }),
      log('conn', 1, 'hello there'),
      begin('rpc:1', 10, { name: 'launchApp', fields: { method: 'launchApp', params: { appId: 'com.x' } } }),
      log('rpc:1', 11, 'the app said hi', { level: 'debug', fields: { stream: 'stdout', pid: 4, line: 1 } }),
      log('rpc:1', 12, 'careful', { level: 'warn' }),
    );
    const out = lines(toOutline(run, { runId: 'r', all: true }));
    expect(out).toEqual(['run r · 1970-01-01T00:00:00.000Z · … (open)', 'info│ hello there', 'launchApp com.x  … (open)', '  stdout│ the app said hi', '  warn│ careful']);
  });

  it('collapses three or more consecutive same-named leaf siblings into one row with a min–max range', () => {
    const taps: Partial012[] = [];
    for (let i = 0; i < 12; i++) {
      taps.push(begin(`rpc:${String(i + 1)}`, 100 + i * 1000, { name: 'invoke', fields: { method: 'invoke', params: { invocation: { type: 'action', action: 'tap', predicate: { type: 'text', value: 'x' } } } } }));
      taps.push(end(`rpc:${String(i + 1)}`, 100 + i * 1000 + 600 + (i % 5) * 100));
    }
    const out = lines(toOutline(file(begin('conn', 0, { type: 'server', name: 'connection' }), ...taps, begin('rpc:99', 99000, { name: 'terminateApp', fields: { method: 'terminateApp' } }), end('rpc:99', 99100)), { headings: false }));
    expect(out[0]).toBe('tap by.text("x") ×12  0.6–1.0 s');
    expect(out[1]).toMatch(/^terminateApp\s+100 ms$/);
    expect(out).toHaveLength(2);
    const two = lines(toOutline(file(begin('conn', 0, { type: 'server', name: 'connection' }), ...taps.slice(0, 4)), { headings: false }));
    expect(two).toHaveLength(2);
    const short = lines(toOutline(file(begin('conn', 0, { type: 'server', name: 'connection' }), ...taps.slice(0, 8).map((l, i) => (l.kind === 'end' ? { ...l, ts: l.ts - 400 * (i % 2) } : l))), { headings: false }));
    expect(short[0]).toMatch(/^tap by\.text\("x"\) ×4 {2}\d+–\d+ ms$/);
  });

  it('under --all, siblings that carry ticks are not collapsed — the app\'s own lines stay — and a multi-line tick continues under its prefix', () => {
    const launches: Partial012[] = [];
    for (let i = 0; i < 3; i++) {
      const id = `rpc:${String(i + 1)}`;
      launches.push(begin(id, 100 + i * 1000, { name: 'launchApp', fields: { method: 'launchApp', params: { appId: 'com.x' } } }));
      launches.push(log(id, 101 + i * 1000, `hello ${String(i)}`, { level: 'debug', fields: { stream: 'stdout', pid: i, line: 1 } }));
      launches.push(end(id, 200 + i * 1000));
    }
    const run = file(begin('conn', 0, { type: 'server', name: 'connection' }), ...launches, log('conn', 5000, 'two\nlines', { level: 'info' }));
    const plain = lines(toOutline(run, { headings: false }));
    expect(plain).toEqual(['launchApp com.x ×3  100 ms']);
    const all = lines(toOutline(run, { headings: false, all: true }));
    expect(all).toEqual([
      'info│ two',
      '      lines',
      'launchApp com.x  100 ms',
      '  stdout│ hello 0',
      'launchApp com.x  100 ms',
      '  stdout│ hello 1',
      'launchApp com.x  100 ms',
      '  stdout│ hello 2',
    ]);
  });

  it('a relay run reads as sections: the local hop under the run heading, each node under its own name', () => {
    const run = file(
      begin('conn', 0, { type: 'server', name: 'connection', fields: { runId: 'r' } }),
      begin('mac-a/conn', 1, { type: 'server', name: 'connection', fields: { runId: 'node-run' } }),
      begin('mac-a/rpc:1', 2, { name: 'allocateDevice', fields: { method: 'allocateDevice' } }),
      end('mac-a/rpc:1', 3),
      begin('step:x', 4, { type: 'step', name: 'local step', fields: { kind: 'step' } }),
      end('step:x', 5, { ok: true, status: 'passed' }),
      end('mac-a/conn', 6),
      end('conn', 7),
    );
    const out = lines(toOutline(run, { runId: 'r' }));
    expect(out).toEqual(['run r · 1970-01-01T00:00:00.000Z · 7 ms', 'local step  1 ms', 'mac-a', 'allocateDevice  1 ms']);
  });

  it('a subtree view has no heading: the root is the first line at depth 0', () => {
    const [selection] = selectUnder(sanityRun(), 'inner');
    const out = lines(toOutline(selection.lines, { headings: false }));
    expect(out[0].startsWith('inner')).toBe(true);
    expect(at(out, 'Sanity')).toBe(-1);
    expect(indent(out[at(out, 'passes')])).toBe(2);
  });
});

describe('toFailures', () => {
  it('one block per innermost failed node, ancestors first, the error, the ticks between begin and end — in seq order', () => {
    const text = toFailures(sanityRun(), { runId: 'run-1' });
    const blocks = text.trimEnd().split('\n\n');
    expect(blocks).toHaveLength(2);
    const first = blocks[0].split('\n');
    expect(first.map((l) => l.trimStart().split(/\s{2,}/)[0])).toEqual([
      'e2e/sanity.test.js',
      'Sanity',
      'inner',
      'passes',
      'allocateDevice udid 0000 ✗ 2001',
      'error 2001: no device matches',
      'debug│ Looking for a matching device',
    ]);
    expect(first[4]).toMatch(/97 ms$/);
    expect(indent(first[5])).toBe(10);
    const second = blocks[1].split('\n');
    expect(second.map((l) => l.trimStart())).toEqual([
      expect.stringMatching(/^e2e\/sanity\.test\.js\s+506 ms$/),
      expect.stringMatching(/^Sanity\s+105 ms$/),
      expect.stringMatching(/^inner\s+104 ms$/),
      expect.stringMatching(/^fails ✗\s+3 ms$/),
      'Error: expect(received).toBe(expected)',
      '',
      'Expected: 2',
      'Received: 1',
    ]);
    expect(text).not.toContain('skipped');
    expect(text).not.toContain('beforeAll');
    expect(text).not.toContain('connection');
  });

  it('ticksAround gathers the ticks of the node and its ancestors between its begin and end, in seq order', () => {
    const run = file(
      begin('step:f', 0, { type: 'step', name: 'file' }),
      log('step:f', 1, 'before — not between'),
      begin('step:t', 2, { type: 'step', name: 'test', parent: 'step:f' }),
      begin('rpc:1', 3, { name: 'tap', parent: 'step:t', fields: { method: 'invoke' } }),
      log('step:f', 4, 'file tick during'),
      log('rpc:1', 5, 'rpc tick during'),
      log('step:t', 6, 'test tick during'),
      end('rpc:1', 7, { ok: false, error: { code: 2014, message: 'no' } }),
      log('step:t', 8, 'after — not between'),
      end('step:t', 9, { ok: false, status: 'failed' }),
      end('step:f', 10, { ok: false, status: 'failed' }),
    );
    const [rpc] = innermostFailures(run);
    expect(ticksAround(rpc).map((t) => t.msg)).toEqual(['file tick during', 'rpc tick during', 'test tick during']);
    expect(lines(toFailures(run)).slice(-3)).toEqual(['      info│ file tick during', '      info│ rpc tick during', '      info│ test tick during']);
  });

  it('says so when nothing failed, names the run when it knows it', () => {
    expect(toFailures(file(begin('conn', 0, { type: 'server', name: 'c' }), end('conn', 1)), { runId: 'r' })).toBe('no failures in run r\n');
    expect(toFailures([])).toBe('no failures\n');
  });

  it('a synthesized end (connection-closed) is a block with its reason; a failed node with a failed child is not innermost', () => {
    const run = file(
      begin('conn', 0, { type: 'server', name: 'connection' }),
      begin('mac-a/rpc:1', 1, { name: 'allocateDevice', fields: { method: 'allocateDevice' } }),
      begin('mac-a/rpc:1/boot', 2, { name: 'boot', parent: 'mac-a/rpc:1', fields: { op: 'boot' } }),
      end('mac-a/rpc:1/boot', 3, { ok: false, reason: 'connection-closed' }, 'boot was still open when the connection closed'),
      end('mac-a/rpc:1', 4, { ok: false, reason: 'connection-closed' }),
      end('conn', 5),
    );
    expect(innermostFailures(run).map((n) => n.id)).toEqual(['mac-a/rpc:1/boot']);
    const out = lines(toFailures(run));
    expect(out).toEqual(['mac-a', expect.stringMatching(/^allocateDevice\s+3 ms$/), expect.stringMatching(/^ {2}boot ✗ connection-closed\s+1 ms$/), '    reason: connection-closed']);
    expect(errorLinesOf(buildTree(run).nodes.get('mac-a/rpc:1')!)).toEqual(['reason: connection-closed']);
    expect(plainNameOf(buildTree(run).nodes.get('mac-a/rpc:1/boot')!)).toBe('boot');
    expect(plainNameOf(buildTree(file(log('rpc:7', 1, 'x'))).nodes.get('rpc:7')!)).toBe('rpc:7');
    const bare = buildTree(file(begin('rpc:1', 0), end('rpc:1', 1, { ok: false }, 'it broke'))).nodes.get('rpc:1')!;
    expect(errorLinesOf(bare)).toEqual(['it broke']);
    expect(errorLinesOf(buildTree(file(begin('rpc:1', 0))).nodes.get('rpc:1')!)).toEqual([]);
    expect(errorLinesOf(buildTree(file(begin('step:1', 0), end('step:1', 1, { ok: false, status: 'failed', error: { message: 'no name' } }))).nodes.get('step:1')!)).toEqual(['error: no name']);
  });

  it('the 012a fixture: eleven code-2014 blocks, each under its hop, in seq order', () => {
    const fixture = parseTraceLines(readFileSync(path.join(__dirname, 'fixtures', 'relay-sanity.jsonl'), 'utf8'));
    const failures = innermostFailures(fixture);
    expect(failures).toHaveLength(11);
    expect(failures.every((n) => (n.end?.fields?.error as { code?: number } | undefined)?.code === 2014)).toBe(true);
    const text = toFailures(fixture, { runId: 'r' });
    const blocks = text.trimEnd().split('\n\n');
    expect(blocks).toHaveLength(11);
    for (const block of blocks) {
      const rows = block.split('\n');
      expect(rows[0]).toBe('mac-a');
      expect(rows.some((r) => r.includes('✗ 2014'))).toBe(true);
      expect(rows.some((r) => r.trimStart().startsWith('error 2014:'))).toBe(true);
    }
    const seqs = failures.map((n) => n.begin!.seq);
    expect([...seqs].sort((a, b) => a - b)).toEqual(seqs);
    expect(ticksAround(failures[0]).every((t) => t.seq > failures[0].begin!.seq && t.seq < failures[0].end!.seq)).toBe(true);
  });
});

describe('selectUnder', () => {
  it('matches a step by name or fullName, an rpc by its human name or method, anything by id; several matches in seq order', () => {
    const run = sanityRun();
    expect(selectUnder(run, 'inner').map((s) => s.node.id)).toEqual(['step:i']);
    expect(selectUnder(run, 'Sanity inner').map((s) => s.node.id)).toEqual(['step:i']);
    expect(selectUnder(run, 'allocateDevice').map((s) => s.node.id)).toEqual(['rpc:1', 'rpc:2']);
    expect(selectUnder(run, 'allocateDevice udid 0000').map((s) => s.node.id)).toEqual(['rpc:2']);
    expect(selectUnder(run, 'allocateDevice udid 0000 ✗ 2001').map((s) => s.node.id)).toEqual(['rpc:2']);
    expect(selectUnder(run, 'step:p').map((s) => s.node.id)).toEqual(['step:p']);
    expect(selectUnder(run, 'rpc:2')[0].lines.map((l) => l.seq)).toEqual([11, 12, 13]);
    expect(selectUnder(run, 'nothing-here')).toEqual([]);
    const tree = buildTree(run);
    expect(matchesUnder(tree.nodes.get('conn')!, 'connection')).toBe(true);
    expect(matchesUnder(buildTree(file(log('rpc:7', 1, 'x'))).nodes.get('rpc:7')!, 'x')).toBe(false);
  });
});

describe('format', () => {
  it('durations and columns', () => {
    expect(formatDuration(0)).toBe('0 ms');
    expect(formatDuration(999.4)).toBe('999 ms');
    expect(formatDuration(1000)).toBe('1.0 s');
    expect(formatDuration(71234)).toBe('71.2 s');
    expect(formatDuration(-5)).toBe('0 ms');
    expect(layoutColumns([{ text: 'a', duration: '1 ms' }, { text: 'bbb', duration: '10 ms' }, { text: 'tick', duration: '' }])).toEqual(['a     1 ms', 'bbb  10 ms', 'tick']);
  });
});

describe('the names of spawns and outcomes — human-readable, not raw argv or result objects', () => {
  it('names a spawned child by the command that ran — interpreter dropped, tokens quoted when needed, long lines capped', async () => {
    const { describeSpawn, describeOutcome } = await import('../names');
    expect(describeSpawn({ argv: ['applesimutils', '--list', '--byType', 'iPhone 17 Pro'] }, 'applesimutils')).toBe('applesimutils --list --byType "iPhone 17 Pro"');
    expect(describeSpawn({ argv: ['/usr/bin/xcrun', 'simctl', 'boot', 'UDID-1'] }, 'simctl')).toBe('simctl boot UDID-1');
    expect(describeSpawn({ argv: ['/usr/bin/xcrun'] }, 'xcrun')).toBe('xcrun');
    expect(describeSpawn({ op: 'boot' }, 'boot')).toBe('boot');
    expect(describeSpawn(undefined, 'boot')).toBe('boot');
    expect(describeSpawn({ argv: ['ditto', 7, '-x'] }, 'ditto')).toBe('ditto -x');
    const long = describeSpawn({ argv: ['simctl', 'launch', 'x'.repeat(200)] }, 'simctl');
    expect(long.length).toBe(96);
    expect(long.endsWith('…')).toBe(true);
    expect(describeOutcome(undefined, undefined)).toBe('');
    expect(describeOutcome(undefined, { ok: true })).toBe('');
    expect(describeOutcome(undefined, { ok: false, error: { code: 2014 } })).toBe(' ✗ 2014');
    expect(describeOutcome(undefined, { ok: false, exitCode: 149 })).toBe(' ✗ exit 149');
    expect(describeOutcome(undefined, { ok: false, signal: 'SIGTERM', exitCode: 0 })).toBe(' ✗ SIGTERM');
    expect(describeOutcome(undefined, { ok: false, status: 'aborted', reason: 'connection-closed' })).toBe(' ✗ aborted connection-closed');
    expect(describeOutcome(undefined, { ok: true, status: 'skipped' })).toBe(' ○ skipped');
    expect(describeOutcome('allocateDevice', { ok: true, result: { udid: 'FD83', allocationId: 'a' } })).toBe(' → FD83');
    expect(describeOutcome('launchApp', { ok: true, result: { pid: 42 } })).toBe(' → pid 42');
    expect(describeOutcome('installApp', { ok: true, result: { pid: 42 } })).toBe('');
  });

  it('the outline and the failure cut print a child\'s command and a failed child\'s exit', () => {
    const run = file(
      begin('conn', 0, { type: 'server', name: 'connection' }),
      begin('rpc:1', 1, { name: 'allocateDevice', fields: { method: 'allocateDevice', params: { device: { id: 'U' } } } }),
      begin('rpc:1/simctl', 2, { name: 'simctl', parent: 'rpc:1', fields: { op: 'simctl', argv: ['/usr/bin/xcrun', 'simctl', 'boot', 'U'], attempt: 1 } }),
      log('rpc:1/simctl', 3, 'Unable to boot device in current state: Booted', { level: 'debug', fields: { stream: 'stderr', line: 1 } }),
      end('rpc:1/simctl', 4, { ok: false, exitCode: 149, attempt: 1 }),
      end('rpc:1', 5, { ok: false, error: { code: 2003, message: 'boot failed', data: { udid: 'U' } } }),
      end('conn', 6),
    );
    const out = lines(toOutline(run, { headings: false }));
    expect(out[0]).toMatch(/^allocateDevice udid U ✗ 2003\s+4 ms$/);
    expect(out[1]).toMatch(/^ {2}simctl boot U ✗ exit 149\s+2 ms$/);
    const cut = lines(toFailures(run));
    expect(cut).toEqual([
      expect.stringMatching(/^allocateDevice udid U\s+4 ms$/),
      expect.stringMatching(/^ {2}simctl boot U ✗ exit 149\s+2 ms$/),
      '    exit code 149',
      '    stderr│ Unable to boot device in current state: Booted',
    ]);
  });
});
