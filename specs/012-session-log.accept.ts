/**
 * Acceptance: spec 012 — the connection log.
 *
 * This file is frozen and append-only. It speaks only the public dialect:
 * `detox/client`, never `@detox-remote/*`; the only other import is
 * `./helpers/*`, which is test scaffolding, not product API. The step and
 * connection-id spellings are reached through `./helpers/typed-door`
 * (`logOf`, an identity once the surface lands).
 *
 * Style is part of the contract: straight-line awaits, no function
 * definitions in this file. The ground truth is the JSONL the server serves
 * over HTTP, read by the raw client in `./helpers/session-log` (the
 * `blob-lane.ts` tradition). Notifications race HTTP reads by design, so a
 * line that follows a fire-and-forget frame is read with `fetchUntil`.
 *
 * Simulator policy: tests 1 and 5 boot a PROBE simulator they create and
 * delete; tests 2, 3, 4 and 6 touch no device.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { connect, DetoxErrorCode } from 'detox/client';

import { startServer, ServerStartupRefusal } from './helpers/server';
import { logOf, rawLogKind, rawAttrs } from './helpers/typed-door';
import { dialConnectionLog, parseNdjson, stdoutLinesAtLevel, settled } from './helpers/session-log';
import { runTornClient } from './helpers/torn-client';
import { createSimulatorExternally, deleteSimulatorExternally, shutdownSimulatorExternally, waitUntil } from './helpers/simctl';
import { tokenOf } from './helpers/project';

const NO_SUCH_DEVICE = '00000000-0000-0000-0000-000000000000';

/**
 * Test 1 — every RPC is a node; server-born children declare their parent;
 * `follow` is live; the file is well-formed; the token is not in it.
 */
void test('RPCs are nodes, the boot child names the allocation as parent, follow is live, the file is well-formed', async (t) => {
  const probe = await createSimulatorExternally('detox-spec012-nodes', t.signal);
  try {
    await using server = await startServer({ dedicated: true, isolatedLogRoot: true, signal: t.signal });
    await using detox = await connect({ server: server.address, signal: t.signal });
    const runId = logOf(detox).runId;
    const lane = dialConnectionLog(server.address);

    const follow = lane.follow(runId, { signal: t.signal });
    const bootChildSeen = follow.next((l) => l.kind === 'begin' && l.fields?.op === 'boot');

    const allocation = detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } });
    const allocationState = settled(allocation);
    const bootChild = await bootChildSeen;
    assert.equal(allocationState.settled, false, 'the boot child begin streamed before the allocation resolved: follow is live');
    await using device = await allocation;
    assert.equal(device.state, 'booted');

    const lines = parseNdjson(await lane.fetch(runId));
    lines.forEach((line, i) => assert.equal(line.seq, i + 1, 'seq is contiguous from 1'));
    for (const line of lines) {
      assert.ok(['begin', 'end', 'log'].includes(line.kind), `unknown kind ${line.kind}`);
      assert.ok(['error', 'warn', 'info', 'debug'].includes(line.level), `unknown level ${line.level}`);
      assert.ok(['rpc', 'step', 'server'].includes(line.node.type), `unknown node type ${line.node.type}`);
    }
    assert.equal(lines[0].node.type, 'server', 'the connection opens its own node first');
    assert.equal(lines[0].kind, 'begin');

    const allocBegin = lines.find((l) => l.kind === 'begin' && l.node.type === 'rpc' && l.fields?.method === 'allocateDevice');
    assert.ok(allocBegin, 'allocateDevice begins as an rpc node');
    assert.equal(allocBegin.node.parent, undefined, 'no step is open, so the allocation is a root');
    assert.equal(bootChild.node.parent, allocBegin.node.id, 'the boot the server started inside the allocation is its child');
    assert.match(bootChild.node.id, /^rpc:.+\/boot$/, 'sub-operation ids are namespaced under their request');
    const allocEnd = lines.find((l) => l.kind === 'end' && l.node.id === allocBegin.node.id);
    assert.ok(allocEnd, 'allocateDevice ends');
    assert.equal(allocEnd.fields?.ok, true);
    assert.equal(typeof allocEnd.fields?.durationMs, 'number');
    const bootEnd = lines.find((l) => l.kind === 'end' && l.node.id === bootChild.node.id);
    assert.ok(bootEnd && bootEnd.seq < allocEnd.seq, 'the child ends before its parent');

    // Meaningful only because `dedicated: true` makes the helper mint a real token; in attach mode the token is empty.
    assert.ok(!(await lane.fetch(runId)).includes(tokenOf(server.address)), 'the bearer token is not in the file');
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 2 — the file records everything; stdout obeys --log-level; ?level= is honest.
 */
void test('--log-level governs stdout only; the file keeps debug; ?level=warn filters and still ends the stream', async (t) => {
  await using server = await startServer({ dedicated: true, isolatedLogRoot: true, logLevel: 'warn', signal: t.signal });
  const detox = await connect({ server: server.address, signal: t.signal });
  const runId = logOf(detox).runId;
  const lane = dialConnectionLog(server.address);

  await assert.rejects(detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: NO_SUCH_DEVICE } }));

  const all = parseNdjson(await lane.fetch(runId));
  const refusalBegin = all.find((l) => l.kind === 'begin' && l.node.type === 'rpc' && l.fields?.method === 'allocateDevice');
  assert.equal(refusalBegin?.level, 'info', 'the refused request\'s begin is an info line, and it is in the file regardless of --log-level');
  const refusalEnd = all.find((l) => l.kind === 'end' && l.node.type === 'rpc' && l.fields?.ok === false);
  assert.ok(refusalEnd);
  assert.equal(refusalEnd.level, 'warn', 'a typed refusal ends at warn');
  assert.equal(refusalEnd.fields?.error?.code, DetoxErrorCode.DETOX_NO_MATCHING_DEVICE, 'the wire error object, verbatim');

  await detox.disconnect();
  await waitUntil(async () => (await lane.index()).some((r) => r.runId === runId && r.endedAt !== undefined), { signal: t.signal });

  const warnUp = parseNdjson(await lane.fetch(runId, { level: 'warn' }));
  assert.ok(warnUp.every((l) => ['warn', 'error'].includes(l.level) || (l.node.id === 'conn' && l.kind === 'end')), 'only warn+ survive, plus the final line');
  assert.equal(warnUp[warnUp.length - 1].node.id, 'conn');
  assert.equal(warnUp[warnUp.length - 1].kind, 'end', 'the final line is always sent regardless of level');
  assert.ok(warnUp.length < all.length);

  assert.equal(stdoutLinesAtLevel(server.logs(), 'info').length, 0, 'stdout at --log-level warn prints no info line');
  assert.ok(stdoutLinesAtLevel(server.logs(), 'warn').length > 0, 'stdout at --log-level warn does print the refusal');
});

/**
 * Test 3 — steps are typed, nest, and end by id in any order.
 */
void test('typed steps end by id in any order; an RPC parents to the most recently begun open step; bad steps are refused at warn', async (t) => {
  await using server = await startServer({ dedicated: true, isolatedLogRoot: true, signal: t.signal });
  await using detox = await connect({ server: server.address, signal: t.signal });
  const trace = logOf(detox);
  const lane = dialConnectionLog(server.address);

  const a = trace.log.begin({ kind: 'test', name: 'login works', attrs: { fullName: 'auth login works', filePath: 'e2e/auth.test.ts', invocation: 1 } });
  const b = trace.log.begin({ kind: 'hook', name: 'beforeEach', attrs: { hookType: 'beforeEach' } });
  a.end({ status: 'failed', error: new Error('expected the login screen') });
  await assert.rejects(detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: NO_SUCH_DEVICE } }));
  b.end({ status: 'passed' });
  const bogus = trace.log.begin({ kind: rawLogKind('bogus'), name: 'nope' });
  const nested = trace.log.begin({ kind: 'step', name: 'deep', attrs: rawAttrs({ deep: { no: true } }) });
  nested.end({ status: 'passed' });

  const lines = parseNdjson(await lane.fetchUntil(trace.runId, (ls) => ls.some((l) => l.kind === 'end' && l.node.id === `step:${nested.id}`), { signal: t.signal }));

  const aBegin = lines.find((l) => l.kind === 'begin' && l.node.id === `step:${a.id}`);
  const bBegin = lines.find((l) => l.kind === 'begin' && l.node.id === `step:${b.id}`);
  assert.ok(aBegin && bBegin);
  assert.equal(aBegin.fields?.kind, 'test');
  assert.deepEqual(aBegin.fields?.attrs, { fullName: 'auth login works', filePath: 'e2e/auth.test.ts', invocation: 1 });
  assert.equal(bBegin.node.parent, aBegin.node.id, 'the hook nests under the test');

  const rpc = lines.find((l) => l.kind === 'begin' && l.node.type === 'rpc' && l.fields?.method === 'allocateDevice');
  assert.ok(rpc);
  assert.equal(rpc.node.parent, bBegin.node.id, 'A ended first, B is the most recently begun open step, the RPC parents to B');

  const aEnd = lines.find((l) => l.kind === 'end' && l.node.id === aBegin.node.id);
  assert.equal(aEnd?.fields?.status, 'failed');
  assert.equal(aEnd?.fields?.error?.message, 'expected the login screen');
  const bEnd = lines.find((l) => l.kind === 'end' && l.node.id === bBegin.node.id);
  assert.ok(bEnd && bEnd.seq > aEnd.seq, 'B ended after A, out of nesting order, and both ends exist');
  assert.equal(bEnd.fields?.status, 'passed');

  assert.ok(!lines.some((l) => l.node.id === `step:${bogus.id}`), 'an unknown kind creates no node');
  const refused = lines.find((l) => l.kind === 'log' && l.fields?.rejected === 'step' && l.fields?.id === bogus.id);
  assert.ok(refused, 'and is refused with typed fields');
  assert.deepEqual({ level: refused.level, kind: refused.fields?.kind }, { level: 'warn', kind: 'bogus' });
  const nestedBegin = lines.find((l) => l.kind === 'begin' && l.node.id === `step:${nested.id}`);
  assert.deepEqual(nestedBegin?.fields?.attrs, { attrsRejected: true }, 'nested attrs are replaced, the step still exists');
});

/**
 * Test 4 — `after` is exact; the connection's end closes `follow`.
 */
void test('after=<seq> resumes exactly; the server closes follow after the final line', async (t) => {
  await using server = await startServer({ dedicated: true, isolatedLogRoot: true, signal: t.signal });
  const detox = await connect({ server: server.address, signal: t.signal });
  const runId = logOf(detox).runId;
  const lane = dialConnectionLog(server.address);

  const follow = lane.follow(runId, { signal: t.signal });
  await assert.rejects(detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: NO_SUCH_DEVICE } }));
  const snapshot = await follow.snapshotWhen((ls) => ls.some((l) => l.kind === 'end' && l.node.type === 'rpc'));
  const lastSeq = snapshot[snapshot.length - 1].seq;

  await detox.disconnect();
  assert.equal(await follow.closed(), true, 'the server ended the stream after the connection ended');

  const rest = parseNdjson(await lane.fetch(runId, { after: lastSeq }));
  assert.ok(rest.length > 0, 'the connection end wrote lines after the cursor');
  assert.equal(rest[0].seq, lastSeq + 1, 'after= resumes at the next seq');
  const whole = parseNdjson(await lane.fetch(runId));
  assert.deepEqual([...snapshot, ...rest].map((l) => l.seq), whole.map((l) => l.seq), 'snapshot + remainder is the file, once');
  assert.deepEqual({ id: whole[whole.length - 1].node.id, kind: whole[whole.length - 1].kind }, { id: 'conn', kind: 'end' }, 'the final line closes the connection node');
});

/**
 * Test 5 — a torn connection names what was in flight; the file and the
 * index survive a graceful restart; the id is announced and unique.
 */
void test('a client killed mid-boot leaves a boot end with reason connection-closed; the file and index survive a restart with distinct ids', async (t) => {
  const probe = await createSimulatorExternally('detox-spec012-torn', t.signal);
  const first = await startServer({ dedicated: true, isolatedLogRoot: true, signal: t.signal });
  try {
    const lane = dialConnectionLog(first.address);
    const torn = await runTornClient({ server: first.address, udid: probe.udid, killWhen: 'boot-child-begun', signal: t.signal });
    assert.equal(torn.exitedBy, 'SIGKILL');

    // The half-booted probe is shut down by the peer's rollback before the connection can end: a real boot's worth of patience.
    await waitUntil(async () => (await lane.index()).some((r) => r.runId === torn.runId && r.endedAt !== undefined), { signal: t.signal, timeoutMs: 120_000, description: 'the torn connection ended' });
    const lines = parseNdjson(await lane.fetch(torn.runId));
    const bootBegin = lines.find((l) => l.kind === 'begin' && l.fields?.op === 'boot');
    assert.ok(bootBegin, 'the boot child began before the kill');
    const bootEnd = lines.find((l) => l.kind === 'end' && l.node.id === bootBegin.node.id);
    assert.ok(bootEnd, 'the server closed the in-flight boot, it is not left dangling');
    assert.deepEqual({ ok: bootEnd.fields?.ok, reason: bootEnd.fields?.reason }, { ok: false, reason: 'connection-closed' }, 'a typed reason, never message text');
    const allocEnd = lines.find((l) => l.kind === 'end' && l.node.id === bootBegin.node.parent);
    assert.ok(allocEnd && allocEnd.seq > bootEnd.seq, 'the allocation ends after its child (LIFO)');
    assert.deepEqual({ ok: allocEnd.fields?.ok, reason: allocEnd.fields?.reason }, { ok: false, reason: 'connection-closed' });
    assert.equal(lines.filter((l) => l.kind === 'end' && l.node.id === bootBegin.node.id).length, 1, 'exactly one end per node');
    const rollback = lines.find((l) => l.kind === 'log' && l.node.id === bootBegin.node.parent && l.seq > bootEnd.seq && l.seq < allocEnd.seq);
    assert.ok(rollback, 'the peer\'s rollback of the half-made allocation is narrated under that request, before its end');
    const last = lines[lines.length - 1];
    assert.deepEqual({ id: last.node.id, kind: last.kind }, { id: 'conn', kind: 'end' }, 'the connection end is the final line');

    await first.stop();
    await using second = await startServer({ dedicated: true, logRoot: first.logRoot, signal: t.signal });
    const lane2 = dialConnectionLog(second.address);
    const again = parseNdjson(await lane2.fetch(torn.runId));
    assert.deepEqual(again.map((l) => l.seq), lines.map((l) => l.seq), 'the same file is served after a restart');

    await using fresh = await connect({ server: second.address, signal: t.signal });
    const freshId = logOf(fresh).runId;
    assert.equal(typeof freshId, 'string');
    assert.notEqual(freshId, torn.runId);
    const index = await lane2.index();
    const rowTorn = index.find((r) => r.runId === torn.runId);
    const rowFresh = index.find((r) => r.runId === freshId);
    assert.ok(rowTorn && rowTorn.endedAt !== undefined && typeof rowTorn.bytes === 'number' && rowTorn.lastSeq === lines.length);
    assert.ok(rowFresh && rowFresh.endedAt === undefined && typeof rowFresh.startedAt === 'string', 'the handle id is the index id');
  } finally {
    await first.stop().catch(() => undefined);
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 6 — a killed server leaves no zombie connection; one server per root.
 */
void test('after a server SIGKILL the next server trims, synthesizes the end, indexes it, and refuses a second live server on the root', async (t) => {
  const first = await startServer({ dedicated: true, isolatedLogRoot: true, signal: t.signal });
  const detox = await connect({ server: first.address, signal: t.signal });
  const runId = logOf(detox).runId;
  await assert.rejects(detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: NO_SUCH_DEVICE } }));
  const before = parseNdjson(await dialConnectionLog(first.address).fetch(runId));
  first.kill();

  await using second = await startServer({ dedicated: true, logRoot: first.logRoot, signal: t.signal });
  const lane = dialConnectionLog(second.address);
  const after = parseNdjson(await lane.fetch(runId));
  assert.deepEqual(after.slice(0, before.length).map((l) => l.seq), before.map((l) => l.seq), 'every complete line survived');
  assert.ok(after.length >= before.length + 1);
  const last = after[after.length - 1];
  assert.deepEqual({ id: last.node.id, kind: last.kind, reason: last.fields?.reason }, { id: 'conn', kind: 'end', reason: 'server-restarted' });
  assert.equal(last.seq, after[after.length - 2].seq + 1, 'the synthesized end follows the last surviving line with the next seq');
  const row = (await lane.index()).find((r) => r.runId === runId);
  assert.ok(row && row.endedAt !== undefined && row.lastSeq === last.seq);
  const follow = lane.follow(runId, { signal: t.signal });
  assert.equal(await follow.closed(), true, 'a follow on an ended connection closes at once');

  await assert.rejects(
    startServer({ dedicated: true, logRoot: first.logRoot, readyTimeoutMs: 5_000, signal: t.signal }),
    (err: ServerStartupRefusal) => err.refusalCode === 'DETOX_LOG_ROOT_HELD',
    'one server per log root: the helper surfaces the typed startup refusal, not any failure',
  );
});
