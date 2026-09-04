/**
 * Acceptance: spec 012a — the Perfetto projection.
 *
 * This file is frozen and append-only. It speaks only the public dialect:
 * `detox/client`, never `@detox-remote/*`; the only other import is
 * `./helpers/*`, which is test scaffolding, not product API.
 *
 * Style is part of the contract: straight-line awaits, no function
 * definitions in this file beyond the step body `detox.step` takes. The
 * ground truths are the JSONL and the trace the server serves over HTTP,
 * read by the raw client in `./helpers/session-log`; the test compares the
 * trace against the JSONL it parsed itself, never against an assumed
 * vocabulary.
 *
 * Device-free: three tests, no simulator boots.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';

import { connect } from 'detox/client';

import { startServer } from './helpers/server';
import { startRelay } from './helpers/relay';
import { dialConnectionLog, parseNdjson, parseTrace } from './helpers/session-log';
import { tokenOf } from './helpers/project';

const NO_SUCH_DEVICE = '00000000-0000-0000-0000-000000000000';

/**
 * Test 1 — the trace is the log, event for event.
 */
void test('every begun-and-ended node is one X event carrying its fields, a log line is a tick on its lane, the step nests its refused RPC, and the metadata counts the file', async (t) => {
  await using server = await startServer({ dedicated: true, isolatedLogRoot: true, signal: t.signal });
  const detox = await connect({ server: server.address, signal: t.signal });
  const runId = detox.runId;
  const lane = dialConnectionLog(server.address);

  await detox.step('outer', async () => {
    detox.log('inside the step');
    await assert.rejects(detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: NO_SUCH_DEVICE } }));
    await sleep(20);
  });
  await detox.disconnect();

  const lines = parseNdjson(await lane.fetchUntil(runId, (ls) => ls.some((l) => l.kind === 'end' && l.node.id === 'conn'), { signal: t.signal }));
  const answer = await lane.get(`/v1/runs/${String(runId)}/trace`);
  assert.equal(answer.status, 200);
  assert.match(answer.headers['content-type'] ?? '', /^application\/json/);
  const trace = parseTrace(answer.body);
  const events = trace.traceEvents;

  const begins = lines.filter((l) => l.kind === 'begin');
  const ended = begins.filter((b) => lines.some((l) => l.kind === 'end' && l.node.id === b.node.id));
  assert.equal(ended.length, begins.length, 'every node ended (the connection is over)');
  assert.ok(ended.length >= 3, 'conn, the step, the refused rpc at least');
  for (const begin of ended) {
    const end = lines.find((l) => l.kind === 'end' && l.node.id === begin.node.id);
    assert.ok(end);
    const xs = events.filter((e) => e.ph === 'X' && e.args?.detox?.id === begin.node.id);
    assert.equal(xs.length, 1, `exactly one X for ${begin.node.id}`);
    const x = xs[0];
    // Names are human — an rpc is named from its method and params, the connection from its run id; a step keeps its own name.
    if (begin.node.type === 'step') assert.equal(x.name, begin.node.name);
    if (begin.node.type === 'rpc' && begin.fields?.method !== undefined) assert.ok(x.name.startsWith(String(begin.fields.method)), `${x.name} starts with the method`);
    if (begin.node.id === 'conn') assert.ok(x.name.includes(String(runId)), 'the connection slice is named by its run id');
    assert.equal(x.cat, begin.node.type);
    assert.equal(x.ts, begin.ts * 1000);
    assert.equal(x.dur, (end.ts - begin.ts) * 1000);
    assert.equal(x.args?.detox?.parent, begin.node.parent);
    // `durationMs` is the slice's own `dur` and is not repeated under args (the JSONL keeps it).
    for (const [key, value] of Object.entries({ ...begin.fields, ...end.fields })) {
      if (key === 'durationMs') continue;
      assert.deepEqual(x.args?.[key], value, `args.${key} of ${begin.node.id} carries the line's value`);
    }
  }
  assert.equal(events.filter((e) => e.ph === 'B').length, 0, 'no B event: every node ended');
  assert.ok(!events.some((e) => e.ph === 'X' && e.args?.durationMs !== undefined), 'no X repeats durationMs under args');
  assert.ok(!events.some((e) => e.ph === 'X' && typeof e.args?.endMsg === 'string' && /ended after \d+ms$/.test(e.args.endMsg)), 'the auto-composed end prose is not stored, so it is not projected');
  assert.deepEqual(events.filter((e) => e.ph === 'M' && e.name === 'thread_name' && e.pid === 1).map((e) => e.args?.name), ['connection'], 'a device-free run has one row per hop, named connection');

  const stepBegin = lines.find((l) => l.kind === 'begin' && l.node.type === 'step' && l.node.name === 'outer');
  assert.ok(stepBegin);
  const stepX = events.find((e) => e.ph === 'X' && e.args?.detox?.id === stepBegin.node.id);
  assert.ok(stepX && stepX.dur !== undefined && stepX.dur >= 15_000, 'the 20 ms timer gives the step a measurable duration');
  const rpcBegin = lines.find((l) => l.kind === 'begin' && l.node.type === 'rpc' && l.fields?.method === 'allocateDevice');
  assert.ok(rpcBegin);
  assert.equal(rpcBegin.node.parent, stepBegin.node.id, 'the refused RPC is the step\'s child');
  const rpcX = events.find((e) => e.ph === 'X' && e.args?.detox?.id === rpcBegin.node.id);
  assert.ok(rpcX);
  assert.deepEqual({ pid: rpcX.pid, tid: rpcX.tid }, { pid: stepX.pid, tid: stepX.tid }, 'the step ended after its RPC, so the RPC rides the step\'s lane');

  const logLine = lines.find((l) => l.kind === 'log' && l.msg === 'inside the step');
  assert.ok(logLine, 'the plain line is in the file');
  const ticks = events.filter((e) => e.ph === 'i' && e.name === 'inside the step');
  assert.equal(ticks.length, 1);
  assert.deepEqual({ pid: ticks[0].pid, tid: ticks[0].tid, level: ticks[0].args?.detox?.level }, { pid: stepX.pid, tid: stepX.tid, level: logLine.level });

  const connX = events.find((e) => e.ph === 'X' && e.args?.detox?.id === 'conn');
  assert.ok(connX && connX.ts !== undefined && connX.dur !== undefined);
  for (const e of events.filter((e) => e.ph === 'X')) {
    assert.ok((e.ts ?? 0) + (e.dur ?? 0) <= connX.ts + connX.dur, `${e.name} ends no later than the connection`);
  }

  const named = events.filter((e) => e.ph === 'M');
  for (const e of events.filter((e) => e.ph !== 'M')) {
    assert.ok(named.some((m) => m.name === 'process_name' && m.pid === e.pid), `pid ${String(e.pid)} is named`);
    assert.ok(named.some((m) => m.name === 'thread_name' && m.pid === e.pid && m.tid === e.tid), `tid ${String(e.tid)} is named`);
    assert.equal(typeof e.ts, 'number', 'every non-M event carries ts');
    if (e.ph === 'X') assert.ok(typeof e.dur === 'number' && e.dur >= 0, 'every X carries a non-negative dur');
  }
  assert.ok(named.some((m) => m.name === 'process_sort_index' && m.pid === 1 && m.args?.sort_index === 0));
  assert.equal(trace.metadata.runId, runId);
  assert.ok(typeof trace.metadata.title === 'string' && trace.metadata.title.length > 0);
  assert.equal(trace.metadata.lines, lines.length);
});

/**
 * Test 2 — the viewer page needs no bearer; the trace keeps the log's gate.
 */
void test('the perfetto page answers 200 text/html without a bearer for any well-formed id and names no token; the trace route refuses exactly as /log does', async (t) => {
  await using server = await startServer({ dedicated: true, isolatedLogRoot: true, signal: t.signal });
  const detox = await connect({ server: server.address, signal: t.signal });
  const runId = detox.runId;
  const lane = dialConnectionLog(server.address);
  await detox.disconnect();

  const page = await lane.get(`/v1/runs/${String(runId)}/perfetto`, { authorized: false });
  assert.equal(page.status, 200);
  assert.match(page.headers['content-type'] ?? '', /^text\/html/);
  assert.equal(page.headers['x-content-type-options'], 'nosniff');
  assert.ok(page.body.includes('https://ui.perfetto.dev'));
  assert.ok(page.body.includes(`/v1/runs/${String(runId)}/trace`), 'the page names its sibling trace path');
  assert.ok(page.body.includes('mode=embedded'));
  assert.ok(!page.body.includes(tokenOf(server.address)), 'the bearer token is not in the page');
  assert.equal((await lane.get('/v1/runs/no-such-run-ever/perfetto', { authorized: false })).status, 200, 'the page is not an oracle for which runs exist');

  assert.equal(await lane.status(`/v1/runs/${String(runId)}/trace`, { authorized: false }), 401);
  assert.equal(await lane.status(`/v1/runs/${String(runId)}/trace`), 200);
  assert.equal(await lane.status('/v1/runs/no-such-run-ever/trace'), 404);
  assert.equal(await lane.status('/v1/runs/not%20an%20id/trace'), 400);
  assert.equal(await lane.status(`/v1/runs/${String(runId)}/perfetto`, { method: 'POST', authorized: false }), 404);
  assert.equal(await lane.status(`/v1/runs/${String(runId)}/perfetto`, { method: 'POST' }), 404);
  assert.equal(await lane.status(`/v1/runs/${String(runId)}/trace`, { method: 'POST', authorized: false }), 401, 'the bearer gate is the first check');
  assert.equal(await lane.status(`/v1/runs/${String(runId)}/trace`, { method: 'POST' }), 404);
});

/**
 * Test 3 — through a relay, a node's hop is its own process.
 */
void test('through a relay the node\'s forwarded lines are X events under a process named after the node, the relay\'s own under pid 1 named relay, and the relay\'s page needs no bearer', async (t) => {
  await using node = await startServer({ dedicated: true, isolatedLogRoot: true, signal: t.signal });
  await using relay = await startRelay({ nodes: [{ name: 'mac-a', server: node }], isolatedLogRoot: true, signal: t.signal });
  const detox = await connect({ server: relay.address, signal: t.signal });
  const runId = detox.runId;
  const lane = dialConnectionLog(relay.address);

  await assert.rejects(detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: NO_SUCH_DEVICE } }));
  await detox.disconnect();

  const lines = parseNdjson(await lane.fetchUntil(runId, (ls) => ls.some((l) => l.kind === 'end' && l.node.id === 'conn'), { signal: t.signal, timeoutMs: 60_000 }));
  assert.ok(lines.some((l) => l.node.id === 'mac-a/conn' && l.kind === 'end'), 'the node\'s connection end crossed the hop');
  const nodeRpcBegin = lines.find((l) => l.kind === 'begin' && l.node.id.startsWith('mac-a/rpc:'));
  assert.ok(nodeRpcBegin, 'the node recorded the fanned-out allocateDevice under its own name');

  const trace = parseTrace((await lane.get(`/v1/runs/${String(runId)}/trace`)).body);
  const events = trace.traceEvents;
  const nodeProcess = events.find((e) => e.ph === 'M' && e.name === 'process_name' && e.args?.name === 'mac-a');
  assert.ok(nodeProcess, 'the node\'s hop is a process named after the node');
  assert.notEqual(nodeProcess.pid, 1);
  const nodeRpcX = events.find((e) => e.ph === 'X' && e.args?.detox?.id === nodeRpcBegin.node.id);
  const nodeConnX = events.find((e) => e.ph === 'X' && e.args?.detox?.id === 'mac-a/conn');
  assert.ok(nodeRpcX && nodeConnX);
  assert.equal(nodeRpcX.pid, nodeProcess.pid);
  assert.equal(nodeConnX.pid, nodeProcess.pid);
  const relayProcess = events.find((e) => e.ph === 'M' && e.name === 'process_name' && e.pid === 1);
  assert.equal(relayProcess?.args?.name, 'relay');
  const relayConnX = events.find((e) => e.ph === 'X' && e.args?.detox?.id === 'conn');
  assert.equal(relayConnX?.pid, 1);
  assert.ok(events.filter((e) => e.ph === 'X' && e.pid === 1).every((e) => !(e.args?.detox?.id ?? '').startsWith('rpc:')), 'the relay records no rpc nodes of its own');

  assert.equal(await lane.status(`/v1/runs/${String(runId)}/perfetto`, { authorized: false }), 200);
});
