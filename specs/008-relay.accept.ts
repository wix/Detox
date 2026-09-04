/**
 * Acceptance: spec 008 — the relay.
 *
 * This file is frozen and append-only.
 *
 * Style is part of the contract: tests are STRAIGHT-LINE — a fence of awaits
 * against the public dialect plus the editable helpers, no function
 * definitions in this file. The relay adds NO client API: every test speaks
 * `connect` from `detox/client` pointed at a relay's address, exactly as it
 * would point at a server's. That sameness IS the product.
 *
 * Fixture policy (binding on this file): two real nodes on one Mac share the
 * one simctl truth, so devices are pinned by `deviceId` to per-test probe
 * simulators and fan-out is steered by CAPACITY (`--max-pool`), never by
 * node order — order across nodes is unspecified, just as selection order
 * within one node is. `--max-pool 0` is the permanently-exhausted node that
 * owns nothing (valid byId → 2001 in ~200 ms, impossible byId → 2002, no
 * simulator touched; the node-side unit contract for it is covered by
 * integration tests).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { connect, DetoxErrorCode } from 'detox/client';
import type { DetoxProgressEvent } from 'detox/client';

import { startServer } from './helpers/server';
import { startRelay, relayLostNode, nodeHolding } from './helpers/relay';
import { assertDetoxError, nodeOutcomesOf, rejectionOf } from './helpers/errors';
import { buildStubAppExternally } from './helpers/apps';
import { countBlobStores } from './helpers/blob-lane';
import {
  appContainerPathExternally,
  createSimulatorExternally,
  deleteSimulatorExternally,
  shutdownSimulatorExternally,
  waitUntil,
} from './helpers/simctl';
// The connection log through the relay — test 8.
import { logOf } from './helpers/typed-door';
import { dialConnectionLog, parseNdjson, settled } from './helpers/session-log';
import { tokenOf } from './helpers/project';

// Not a latency budget: "instant" means the relay never queues, sleeps or
// re-polls waiting for capacity (no waiting machinery of any kind).
// Both nodes in the refusal test hold and release nothing, so a queueing
// relay would simply never answer; any finite ceiling catches that. Sized
// for the worst legitimate path this fence can produce: two COLD nodes each
// paying a full `applesimutils --list` on their first refusal (the recorded
// cold-memo cost — accept-002's 1 s bound holds only because a preceding
// allocation warms the memo, and nothing warms these), two ws dials, and a
// loaded Mac; also comfortably above the spec's 30 s per-attempt stall
// window so a single stalled attempt cannot masquerade as a queue.
const INSTANT_MS = 90_000;

/**
 * The one capability test 6's reclaim wait needs from the handle it acquires
 * inside a closure (the 002 `Releasable` precedent — a narrowing interface
 * over the existing public type, not a forward declaration).
 */
interface ReclaimedDevice {
  readonly info: { readonly udid: string };
  release(): Promise<unknown>;
}

/**
 * Test 1 — transparency. Pointed at a relay instead of a server, a test
 * run cannot tell the difference: allocation narrates its boot ($/progress
 * crossed both hops), `installApp` really installs — and the NODE's store
 * reports exactly one freshly stored blob, so the bytes reached the node's
 * own store through the relay address the client dialed, over the blob
 * lane end to end. Whether the relay stored-and-forwarded or streamed is
 * deliberately NOT distinguishable here — the relay-store dedup story is
 * covered by integration tests.
 */
test('pointed at a relay instead of a server, a run cannot tell: allocate narrates, install lands on the node', async (t) => {
  const probe = await createSimulatorExternally('detox-spec008-transparent', t.signal);
  const bundleId = 'com.detox.spec008.transparent';
  try {
    await using node = await startServer({
      dedicated: true,
      maxPool: 1,
      isolatedBlobStore: true,
      signal: t.signal,
    });
    await using relay = await startRelay({
      nodes: [{ name: 'mac-a', server: node }],
      signal: t.signal,
    });
    await using detox = await connect({ server: relay.address, signal: t.signal });

    const events: DetoxProgressEvent[] = [];
    await using device = await detox.allocateDevice({
      type: 'ios.simulator',
      device: { deviceId: probe.udid },
      onProgress: (event) => {
        events.push(event);
      },
    });
    assert.equal(device.info.udid, probe.udid, 'the relay handed back the pinned probe');
    assert.ok(
      events.map((event) => event.name).includes('boot'),
      'the cold probe boot is narrated through the relay — $/progress crossed both hops',
    );

    const appPath = await buildStubAppExternally(bundleId, t.signal);
    await device.installApp(appPath);
    assert.ok(
      await appContainerPathExternally(probe.udid, bundleId, t.signal),
      "simctl's own ground truth: the app container exists — the install crossed the relay",
    );
    assert.equal(
      countBlobStores(node.logs()),
      1,
      "the NODE's store received the build exactly once, through the relay address the client dialed",
    );

    await device.release();
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 2 — one full Mac never fails the fleet. Node order is
 * unspecified, so this test pins the OUTCOME only: the run gets its device
 * although one node has no capacity. (When the relay happens to try the
 * free node first, the walk-past goes unexercised here — that is the
 * price of the order-is-unspecified discipline; test 3's per-node
 * aggregate is what proves every node genuinely gets tried.)
 */
test('a full Mac does not fail the run: allocation lands on a node with room', async (t) => {
  const probe = await createSimulatorExternally('detox-spec008-fanout', t.signal);
  try {
    await using full = await startServer({ dedicated: true, maxPool: 0, signal: t.signal });
    await using free = await startServer({ dedicated: true, maxPool: 1, signal: t.signal });
    await using relay = await startRelay({
      nodes: [
        { name: 'mac-full', server: full },
        { name: 'mac-free', server: free },
      ],
      signal: t.signal,
    });
    await using detox = await connect({ server: relay.address, signal: t.signal });

    await using device = await detox.allocateDevice({
      type: 'ios.simulator',
      device: { deviceId: probe.udid },
    });
    assert.equal(
      device.info.udid,
      probe.udid,
      'the fleet answered although one of its Macs was full',
    );
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 3 — the whole fleet refuses ONCE, instantly, naming every
 * Mac. All-exhausted → one DETOX_POOL_EXHAUSTED whose `details.nodes`
 * carries one entry per configured node, in config order, under the
 * operator's own names, each with that node's own refusal code — this is
 * also the assertion that proves the fan-out really visits every node. An
 * impossible query → DETOX_NO_MATCHING_DEVICE (all-2002 collapses to 2002:
 * across a fleet, transient-anywhere beats terminal-elsewhere — the spec's
 * deliberate inversion of the one-host precedence).
 */
test('a fleet with nothing free refuses once, instantly, naming every Mac', async (t) => {
  const probe = await createSimulatorExternally('detox-spec008-refusal', t.signal);
  try {
    await using nodeA = await startServer({ dedicated: true, maxPool: 0, signal: t.signal });
    await using nodeB = await startServer({ dedicated: true, maxPool: 0, signal: t.signal });
    await using relay = await startRelay({
      nodes: [
        { name: 'mac-a', server: nodeA },
        { name: 'mac-b', server: nodeB },
      ],
      signal: t.signal,
    });
    await using detox = await connect({ server: relay.address, signal: t.signal });

    const before = Date.now();
    const err = assertDetoxError(
      await rejectionOf(
        detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } }),
        'fleet-wide refusal',
      ),
      'fleet-wide refusal',
    );
    const elapsedMs = Date.now() - before;
    assert.equal(err.code, DetoxErrorCode.DETOX_POOL_EXHAUSTED);
    assert.ok(
      elapsedMs < INSTANT_MS,
      `expected an instant fleet refusal, waited ${String(elapsedMs)}ms`,
    );
    const outcomes = nodeOutcomesOf(err, 'fleet-wide refusal');
    assert.deepEqual(
      outcomes.map((outcome) => outcome.node),
      ['mac-a', 'mac-b'],
      'every configured Mac is named, in config order, under its operator-chosen name',
    );
    for (const outcome of outcomes) {
      assert.equal(
        outcome.code,
        DetoxErrorCode.DETOX_POOL_EXHAUSTED,
        `node ${outcome.node} reports its own refusal code`,
      );
    }

    const impossible = assertDetoxError(
      await rejectionOf(
        detox.allocateDevice({
          type: 'ios.simulator',
          device: { deviceId: 'DEAD0000-0000-4000-8000-000000000000' },
        }),
        'impossible fleet-wide query',
      ),
      'impossible fleet-wide query',
    );
    assert.equal(
      impossible.code,
      DetoxErrorCode.DETOX_NO_MATCHING_DEVICE,
      'a query no Mac can ever satisfy is terminal for the fleet, not "try again"',
    );
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 4 — one run, two Macs, addressing intact. With one slot per
 * node, two pinned allocations are FORCED onto different nodes — whose
 * first allocations both mint the same raw per-process id (DevicePool's
 * counter starts identically in every server life). If the relay leaked
 * raw node ids, the two handles would collide. What catches the collision:
 * the released device's slot is immediately re-allocatable (a misrouted
 * release would have freed the wrong node), and the OTHER handle still
 * routes — `second.shutdown()` resolving with `second.state` updated means
 * the verb and its state push both reached the right node and came back
 * addressed to the right handle.
 */
test('one run holds devices on two Macs; finishing with one leaves the other alive', async (t) => {
  const probeOne = await createSimulatorExternally('detox-spec008-fleet-1', t.signal);
  const probeTwo = await createSimulatorExternally('detox-spec008-fleet-2', t.signal);
  try {
    await using nodeA = await startServer({ dedicated: true, maxPool: 1, signal: t.signal });
    await using nodeB = await startServer({ dedicated: true, maxPool: 1, signal: t.signal });
    await using relay = await startRelay({
      nodes: [
        { name: 'mac-a', server: nodeA },
        { name: 'mac-b', server: nodeB },
      ],
      signal: t.signal,
    });
    await using detox = await connect({ server: relay.address, signal: t.signal });

    const first = await detox.allocateDevice({
      type: 'ios.simulator',
      device: { deviceId: probeOne.udid },
    });
    await using second = await detox.allocateDevice({
      type: 'ios.simulator',
      device: { deviceId: probeTwo.udid },
    });
    assert.equal(first.info.udid, probeOne.udid);
    assert.equal(second.info.udid, probeTwo.udid);

    await first.release();
    await using again = await detox.allocateDevice({
      type: 'ios.simulator',
      device: { deviceId: probeOne.udid },
    });
    assert.equal(
      again.info.udid,
      probeOne.udid,
      'release freed a slot for exactly this device again — a misrouted release could not have',
    );

    await second.shutdown();
    assert.equal(
      second.state,
      'shutdown',
      "the other Mac's device still answers verbs, addressed to the right handle",
    );
  } finally {
    for (const probe of [probeOne, probeTwo]) {
      await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
      await deleteSimulatorExternally(probe.udid).catch(() => undefined);
    }
  }
});

/**
 * Test 5 — a dead Mac costs its own devices only. Kill the node
 * that holds the first device (discovered from node logs — placement is
 * unspecified): the very next verb on the orphaned handle settles TYPED —
 * in-flight loss (2006) or known-dead handle (2008), depending on which
 * side of the relay's noticing the verb lands — never a hang (nothing
 * below the relay has a timeout to save it; settling is the relay's job,
 * spec 008 "upstream death settles everything it stranded"). Once the
 * relay has logged the loss — which the spec pins to happen only after
 * the dead node's routing state is gone — the answer is deterministic:
 * stale handle. The surviving Mac's device keeps working through it all.
 */
test('a dead Mac costs its own devices only — typed errors, never a hang', async (t) => {
  const probeOne = await createSimulatorExternally('detox-spec008-dead-1', t.signal);
  const probeTwo = await createSimulatorExternally('detox-spec008-dead-2', t.signal);
  try {
    await using nodeA = await startServer({ dedicated: true, maxPool: 1, signal: t.signal });
    await using nodeB = await startServer({ dedicated: true, maxPool: 1, signal: t.signal });
    const nodes = [
      { name: 'mac-a', server: nodeA },
      { name: 'mac-b', server: nodeB },
    ];
    await using relay = await startRelay({ nodes, signal: t.signal });
    await using detox = await connect({ server: relay.address, signal: t.signal });

    const first = await detox.allocateDevice({
      type: 'ios.simulator',
      device: { deviceId: probeOne.udid },
    });
    await using second = await detox.allocateDevice({
      type: 'ios.simulator',
      device: { deviceId: probeTwo.udid },
    });

    const dead = nodeHolding(probeOne.udid, nodes);
    dead.server.kill();

    const raced = assertDetoxError(
      await rejectionOf(first.shutdown(), 'verb racing the death of its Mac'),
      'verb racing the death of its Mac',
    );
    assert.ok(
      raced.code === DetoxErrorCode.DETOX_CONNECTION_LOST ||
        raced.code === DetoxErrorCode.DETOX_STALE_HANDLE,
      `typed either way — in-flight loss or known-dead handle, got ${String(raced.code)}`,
    );

    await waitUntil(() => relayLostNode(relay.logs(), dead.name), {
      signal: t.signal,
      description: `the relay to log losing ${dead.name}`,
    });
    const postMortem = assertDetoxError(
      await rejectionOf(first.boot(), 'verb after the loss is known'),
      'verb after the loss is known',
    );
    assert.equal(
      postMortem.code,
      DetoxErrorCode.DETOX_STALE_HANDLE,
      'once the loss is known, a dead handle is a stale handle — one answer',
    );

    await second.shutdown();
    assert.equal(
      second.state,
      'shutdown',
      "the surviving Mac's device worked through its sibling Mac's death",
    );
  } finally {
    for (const probe of [probeOne, probeTwo]) {
      await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
      await deleteSimulatorExternally(probe.udid).catch(() => undefined);
    }
  }
});

/**
 * Test 6 — a finished run frees the whole farm. The client's goodbye is
 * just a socket close (there are no courtesy releases); the relay must
 * convert it into upstream closes, which are what make each node reclaim
 * (the connection is the lease, and client⇄relay is THE lease under a
 * relay). The pin: a second run gets the
 * first run's device. Reclaim-vs-redial is a race by design, so the
 * polling wait below is the accept-002 reclaim-retry precedent, not a
 * hidden grace period: a relay that failed to close upstream leaves the
 * one-slot node full forever and the wait times out.
 */
test('a finished run frees the whole farm: the next run gets the same device', async (t) => {
  const probe = await createSimulatorExternally('detox-spec008-goodbye', t.signal);
  try {
    await using node = await startServer({ dedicated: true, maxPool: 1, signal: t.signal });
    await using relay = await startRelay({
      nodes: [{ name: 'mac-a', server: node }],
      signal: t.signal,
    });

    const firstRun = await connect({ server: relay.address, signal: t.signal });
    await firstRun.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } });
    await firstRun.disconnect();

    await using secondRun = await connect({ server: relay.address, signal: t.signal });
    let handoff: ReclaimedDevice | undefined;
    await waitUntil(
      async () => {
        try {
          handoff = await secondRun.allocateDevice({
            type: 'ios.simulator',
            device: { deviceId: probe.udid },
          });
          return true;
        } catch (err) {
          assert.equal(
            assertDetoxError(err, 'reclaim retry').code,
            DetoxErrorCode.DETOX_POOL_EXHAUSTED,
            'while the reclaim is in flight the only acceptable answer is "still held"',
          );
          return false;
        }
      },
      { signal: t.signal, description: "the first run's device to be reclaimed and re-allocated" },
    );
    assert.ok(handoff, 'the first run\'s device was reclaimed and handed to the second run');
    assert.equal(handoff.info.udid, probe.udid);
    await handoff.release();
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 7 — Ctrl+C through the relay settles, and the fleet forgets. A
 * cancelled call keeps no clock: it settles on an
 * answer, an ack, or a close — so a relay that mislaid either the
 * $/cancelRequest or its settlement would park this rejection until the
 * accept runner's wedge ceiling kills the run (the eternal-park trap; the
 * per-test timeout is the runner's, node:test's own default is infinite).
 * The pin: the abort rejects as DETOX_ABORTED, and the node's own
 * rollback ran — the same one-slot device is immediately allocatable
 * again. (The spec's "never tear down the upstream socket to cancel
 * faster" rule is NOT distinguishable here — a socket-tearing relay
 * would free the probe too; that rule is covered by integration tests.)
 */
test('a cancelled allocation through the relay settles typed, and the device comes back', async (t) => {
  const probe = await createSimulatorExternally('detox-spec008-cancel', t.signal);
  try {
    await using node = await startServer({ dedicated: true, maxPool: 1, signal: t.signal });
    await using relay = await startRelay({
      nodes: [{ name: 'mac-a', server: node }],
      signal: t.signal,
    });
    await using detox = await connect({ server: relay.address, signal: t.signal });

    const controller = new AbortController();
    const reason = new Error('spec-008 cancels mid-boot');
    const events: DetoxProgressEvent[] = [];
    const allocating = detox.allocateDevice({
      type: 'ios.simulator',
      device: { deviceId: probe.udid },
      signal: controller.signal,
      onProgress: (event) => {
        events.push(event);
      },
    });
    // Adopted before anything can reject it: a red run must read as an
    // assertion failure, never as an unhandled rejection racing a timeout.
    const rejection = rejectionOf(allocating, 'cancelled allocation');

    await waitUntil(() => events.some((event) => event.name === 'boot'), {
      signal: t.signal,
      description: 'the boot narration to start (the abort must land mid-flight)',
    });
    controller.abort(reason);

    const err = assertDetoxError(await rejection, 'cancelled allocation');
    assert.equal(err.name, 'AbortError');
    assert.equal(err.code, DetoxErrorCode.DETOX_ABORTED);

    await using retry = await detox.allocateDevice({
      type: 'ios.simulator',
      device: { deviceId: probe.udid },
    });
    assert.equal(
      retry.info.udid,
      probe.udid,
      "the cancelled allocation's rollback freed the one-slot node — the fleet holds no ghost",
    );
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 8 — one connection id, one LIVE log, through the relay. The relay
 * announces its own connection log, so `log.begin` is live rather than a
 * typed refusal. A `follow` on the relay sees the node's own boot begin
 * (under `mac-a/`) BEFORE the allocation has resolved: node lines stream
 * into the relay's file as they happen, not when the run ends — seeing what
 * is breaking without ending the run is the point. A step opened before the
 * allocation must cross the hop ahead of the allocation frame (the
 * per-node FIFO plus replay-on-fresh-dial: the node is first dialed by
 * this very allocation), which the node proves by parenting its own
 * `allocateDevice` record to that step. The node is STOPPED before the
 * final read, and the read still returns the node's lines — CI reads a
 * finished run from the relay after the node has forgotten it.
 */
test('through a relay a run has one live log: node lines stream in before the allocation resolves, a step crosses the hop, and the node\'s lines outlive the node', async (t) => {
  const probe = await createSimulatorExternally('detox-spec008-log', t.signal);
  const node = await startServer({ dedicated: true, maxPool: 1, isolatedLogRoot: true, signal: t.signal });
  try {
    await using relay = await startRelay({
      nodes: [{ name: 'mac-a', server: node }],
      isolatedLogRoot: true,
      signal: t.signal,
    });
    const detox = await connect({ server: relay.address, signal: t.signal });
    const trace = logOf(detox);
    const runId = trace.runId;
    assert.equal(typeof runId, 'string', 'the relay announces a connection log of its own');
    const lane = dialConnectionLog(relay.address);

    const follow = lane.follow(runId, { signal: t.signal });
    const nodeBootSeen = follow.next((l) => l.kind === 'begin' && l.fields?.op === 'boot' && l.node.id.startsWith('mac-a/'));

    const step = trace.log.begin({ kind: 'test', name: 'boots through the relay' });
    const allocation = detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: probe.udid } });
    const allocationState = settled(allocation);
    await nodeBootSeen;
    assert.equal(allocationState.settled, false, "the node's boot begin reached the relay's stream before the allocation resolved: live, not end-of-run");
    const device = await allocation;
    assert.equal(device.info.udid, probe.udid);
    await device.release();
    step.end({ status: 'passed' });
    await detox.disconnect();

    assert.equal(await follow.closed(), true, 'the relay ended the stream after its own connection end');
    await waitUntil(
      async () => (await lane.index()).some((row) => row.runId === runId && row.endedAt !== undefined),
      { signal: t.signal, timeoutMs: 120_000, description: 'the relay index to show the connection ended' },
    );
    await node.stop();

    const text = await lane.fetch(runId);
    const lines = parseNdjson(text);
    lines.forEach((line, i) => assert.equal(line.seq, i + 1, 'seq is contiguous from 1 across the merged file'));
    const last = lines[lines.length - 1];
    assert.deepEqual({ id: last.node.id, kind: last.kind }, { id: 'conn', kind: 'end' }, "the relay's own connection end is the final line");

    const spanBegin = lines.find((l) => l.kind === 'begin' && l.node.id === `step:${step.id}`);
    assert.ok(spanBegin, "the step is in the relay's own lane");
    const nodeAlloc = lines.find(
      (l) => l.kind === 'begin' && l.node.type === 'rpc' && l.fields?.method === 'allocateDevice' && l.node.id.startsWith('mac-a/'),
    );
    assert.ok(nodeAlloc, "the node's own record of the allocation is in the relay's file, under the node's name, read after the node stopped");
    assert.equal(nodeAlloc.node.parent, `mac-a/step:${step.id}`, 'the step crossed the hop ahead of the allocation: the node parented the request to it');
    const bootChild = lines.find((l) => l.kind === 'begin' && l.fields?.op === 'boot' && l.node.parent === nodeAlloc.node.id);
    assert.ok(bootChild, "the node's boot child sits under its allocation, ids rewritten consistently");

    assert.ok(!text.includes(new URL(node.url).host), 'no node URL in the file');
    assert.ok(!text.includes(tokenOf(node.address)), 'no node token in the file');
  } finally {
    await node.stop().catch(() => undefined);
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});
