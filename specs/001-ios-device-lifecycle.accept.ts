/**
 * Acceptance criterion for spec 001.
 *
 * This file is frozen and append-only. It speaks only the public dialect:
 * `detox/client` — never `@detox-remote/*`. The only other import allowed is
 * `./helpers/*`, which is test scaffolding, not product API.
 *
 * The three tests that assert the implicit `boot` operation cold-pin their
 * allocation via `shutdownSingleModel`: since spec 002 a warm handoff reports
 * no boot operation, so an assertion about the implicit boot needs a device
 * that genuinely has one coming.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { connect } from 'detox/client';
import type { DetoxOperationRef, DetoxProgressEvent } from 'detox/client';

import { startServer } from './helpers/server';
import {
  shutdownSimulatorExternally,
  shutdownSingleModel,
  simulatorState,
  waitUntil,
} from './helpers/simctl';

const namesOf = (events: readonly DetoxProgressEvent[]): string[] =>
  events.map((event) => event.name);

const descendsFromBoot = (event: DetoxProgressEvent): boolean => {
  for (
    let operation: DetoxOperationRef | undefined = event.operation;
    operation;
    operation = operation.parent
  ) {
    if (operation.name === 'boot') return true;
  }
  return false;
};

test('allocate, cycle, and release an iOS simulator over LAN', async (t) => {
  // One mock per observed call: mixing them loses the ability to say which
  // call reported progress.
  const onAllocate = t.mock.fn((_event: DetoxProgressEvent): void => {});
  const onShutdown = t.mock.fn((_event: DetoxProgressEvent): void => {});
  const onBoot = t.mock.fn((_event: DetoxProgressEvent): void => {});
  const onRelease = t.mock.fn((_event: DetoxProgressEvent): void => {});
  const eventsOf = (
    mock: typeof onAllocate,
  ): DetoxProgressEvent[] => mock.mock.calls.map(({ arguments: [event] }) => event);

  // t.signal aborts the whole flow if the test times out or is cancelled. It is
  // passed once, at the root of each resource: every call made through `detox`
  // inherits the session signal, so per-call `signal` is only for narrowing.
  await using server = await startServer({ signal: t.signal });
  await using detox = await connect({ server: server.address, signal: t.signal });

  // `await using`: the device goes back to the pool even if an assertion below
  // throws — on a shared LAN server a leaked allocation blocks everyone.
  await using device = await detox.allocateDevice({
    type: 'ios.simulator',
    device: { model: 'iPhone 17' },
    onProgress: onAllocate,
  });

  const allocateEvents = eventsOf(onAllocate);
  assert.ok(allocateEvents.length > 0, 'expected progress during allocation');
  assert.ok(
    namesOf(allocateEvents).includes('allocateDevice'),
    `expected events attributed to allocateDevice, got: ${namesOf(allocateEvents).join(', ')}`,
  );

  // No re-narrowing: allocateDevice carries the requested `type` into the
  // result, so `info.udid` is simply there.
  assert.equal(device.info.type, 'ios.simulator');
  assert.ok(device.info.udid.length > 0, 'expected the allocated device to carry a udid');

  // Allocation yields a *ready* device — no boot flag, no second call.
  assert.equal(device.state, 'booted', 'expected allocation to hand back a booted device');

  // A real round trip: down and back up. A method that does nothing cannot
  // satisfy this.
  await device.shutdown({ onProgress: onShutdown });
  assert.equal(device.state, 'shutdown');
  assert.ok(eventsOf(onShutdown).length > 0, 'expected progress during shutdown');

  await device.boot({ onProgress: onBoot });
  assert.equal(device.state, 'booted');
  const bootEvents = eventsOf(onBoot);
  assert.ok(bootEvents.length > 0, 'expected progress during boot');
  // A per-call handler sees its own operation and the ones it starts — nothing
  // from a sibling call.
  assert.ok(
    bootEvents.every((event) => descendsFromBoot(event)),
    `expected only the boot subtree on the boot handler, got: ${namesOf(bootEvents).join(', ')}`,
  );

  // Idempotence: booting an already-booted device resolves instead of throwing.
  // The terminal state lives in the promise, not in the progress stream.
  await device.boot();
  assert.equal(device.state, 'booted');

  await device.release({ onProgress: onRelease });
  assert.ok(eventsOf(onRelease).length > 0, 'expected progress during release');
});

/**
 * The session channel is what reporters, IDE integrations and slow-operation
 * watchdogs hang off. Asserting it here is what forces the implementation to
 * make operations first-class objects instead of bare async functions.
 */
test('every operation surfaces on the session-wide channel', async (t) => {
  await using server = await startServer({ signal: t.signal });
  await using detox = await connect({ server: server.address, signal: t.signal });

  const started: DetoxOperationRef[] = [];
  const ended: string[] = [];
  detox.on('operation', (operation) => {
    started.push(operation);
    operation.on('end', (event) => {
      assert.equal(event.operation.id, operation.id);
      assert.ok(event.durationMs >= 0);
      ended.push(operation.name);
    });
  });

  // Cold-pinned: the implicit boot must really happen to surface on the
  // channel — a warm handoff has none (spec 002).
  const model = await shutdownSingleModel(t.signal);
  await using device = await detox.allocateDevice({ type: 'ios.simulator', device: { model } });
  await device.shutdown();
  await device.release();

  assert.ok(
    started.some((operation) => operation.name === 'allocateDevice'),
    'expected allocateDevice on the session channel',
  );
  // `boot` is there because allocation performs it — nobody called it directly.
  assert.deepEqual(
    new Set(ended),
    new Set(['allocateDevice', 'boot', 'shutdown', 'release']),
    'expected every operation, including the implicit boot, to report its end',
  );
  assert.ok(
    started.every((operation) => operation.id && operation.startedAt > 0),
    'expected every operation to carry an id and a start time',
  );
  assert.match(
    String(started[0]?.origin.stack),
    /001-ios-device-lifecycle\.accept\.ts/,
    "expected the operation's origin stack to point at the caller",
  );
});

/**
 * Proof that the client really talks to a server: an unreachable address must
 * fail, and it must fail as a rejection (connect returns a promise, so `.catch()`
 * has to work).
 */
test('connect rejects when the server is unreachable', async (t) => {
  await assert.rejects(
    connect({ server: 'ws://127.0.0.1:1', signal: t.signal }),
    // Not merely "it rejected" — any stub satisfies that. It has to fail as a
    // *connection*.
    (error: Error) => error.name === 'DetoxConnectionError',
  );
});

/**
 * The operation dialect at the call site: one handler, several nested
 * operations, told apart by the flyweight ref rather than by parsing messages.
 */
test('a single handler can demultiplex nested operations', async (t) => {
  await using server = await startServer({ signal: t.signal });
  await using detox = await connect({ server: server.address, signal: t.signal });

  const onProgress = t.mock.fn((_event: DetoxProgressEvent): void => {});

  // Allocation of a cold device boots implicitly, so two operations report
  // through one handler (cold-pinned: a warm handoff has no implicit boot).
  const model = await shutdownSingleModel(t.signal);
  await using device = await detox
    .allocateDevice({ type: 'ios.simulator', device: { model } })
    .on('progress', onProgress);

  const events = onProgress.mock.calls.map(({ arguments: [event] }) => event);
  const names = new Set(namesOf(events));
  assert.ok(names.has('allocateDevice'), 'expected the allocation to narrate itself');
  assert.ok(names.has('boot'), 'expected the implicit boot to share the handler');
  assert.ok(
    events.some((event) => event.name === 'boot' && event.operation.parent?.name === 'allocateDevice'),
    'expected the implicit boot to name allocateDevice as its parent',
  );

  await device.release();
});

/**
 * Carrying the ref lets the handler give up where the evidence arrives, with
 * no controller threaded through by hand.
 */
test('a handler can cancel the operation that is reporting to it', async (t) => {
  await using server = await startServer({ signal: t.signal });
  await using detox = await connect({ server: server.address, signal: t.signal });

  const tooSlow = new Error('boot took longer than this test is willing to wait');
  // Cold-pinned so the boot — and the progress event carrying its ref — is
  // guaranteed to occur.
  const model = await shutdownSingleModel(t.signal);
  const operation = detox
    .allocateDevice({ type: 'ios.simulator', device: { model } })
    .on('progress', (event) => {
    if (event.name === 'boot') {
      event.operation.abort(tooSlow);
    }
  });

  await assert.rejects(operation, (error: Error) => {
    assert.equal(error.name, 'AbortError');
    assert.equal(error.cause, tooSlow);
    // Captured once, at creation: the stack points at THIS file, not at some
    // frame deep inside the transport.
    assert.match(String(operation.origin.stack), /001-ios-device-lifecycle\.accept\.ts/);
    return true;
  });
});

/**
 * The seam an IDE plugin or a reporter would use: purely cross-cutting, no
 * per-call wiring, nothing written to the console from inside the operation.
 */
test('a watchdog can flag slow operations without any call knowing about it', async (t) => {
  await using server = await startServer({ signal: t.signal });
  await using detox = await connect({ server: server.address, signal: t.signal });

  const slow: string[] = [];
  const SLOW_MS = 60_000;
  detox.on('operation', (operation) => {
    const timer = setTimeout(() => slow.push(operation.name), SLOW_MS);
    timer.unref();
    operation.on('end', () => {
      clearTimeout(timer);
    });
  });

  await using device = await detox.allocateDevice({ type: 'ios.simulator' });
  await device.release();

  assert.deepEqual(slow, [], 'nothing should have been flagged as slow in a healthy run');
});

/**
 * Cancellation is the spec's second half, and the project's frozen constraint says
 * it must reach the child process — so aborting mid-boot must reject, and the
 * device must still be releasable afterwards.
 */
test('aborting a boot rejects and leaves the device usable', async (t) => {
  await using server = await startServer({ signal: t.signal });
  await using detox = await connect({ server: server.address, signal: t.signal });
  await using device = await detox.allocateDevice({ type: 'ios.simulator' });
  // Allocation left it booted, so shut it down first — aborting a no-op proves
  // nothing.
  await device.shutdown();

  const controller = new AbortController();
  const booting = device.boot({
    signal: controller.signal,
    onProgress: () => {
      controller.abort();
    },
  });

  await assert.rejects(booting, (error: Error) => error.name === 'AbortError');

  // Ground truth, asked of simctl rather than of the client: the frozen
  // constraint says cancellation reaches the child process. A client that only
  // rejects its own promise and sets `state` would pass everything above and
  // fail here.
  assert.notEqual(
    await simulatorState(device.info.udid, t.signal),
    'Booted',
    'expected the aborted boot to leave no running simulator behind',
  );

  await device.release();
});

/**
 * Something shuts the simulator down behind Detox's back. The client must find
 * out, which is only possible if the server watches the device and pushes state
 * — a request/response-only transport cannot pass this.
 */
test('device state reflects a shutdown that happened outside Detox', async (t) => {
  await using server = await startServer({ signal: t.signal });
  await using detox = await connect({ server: server.address, signal: t.signal });
  await using device = await detox.allocateDevice({ type: 'ios.simulator' });
  assert.equal(device.state, 'booted');

  await shutdownSimulatorExternally(device.info.udid, t.signal);

  await waitUntil(() => device.state === 'shutdown', {
    signal: t.signal,
    description: 'the client to notice the out-of-band shutdown',
  });

  // And it recovers: the handle is still ours, so we can bring it back up.
  await device.boot();
  assert.equal(device.state, 'booted');
});

/**
 * Two obligations of the operation object that are easy to implement wrongly
 * and impossible to notice later.
 */
test('an operation loses no progress and never crashes the process', async (t) => {
  await using server = await startServer({ signal: t.signal });
  await using detox = await connect({ server: server.address, signal: t.signal });

  const viaOption = t.mock.fn((_event: DetoxProgressEvent): void => {});
  const viaSubscription = t.mock.fn((_event: DetoxProgressEvent): void => {});

  // Subscribing happens one statement *after* the call started. Nothing may be
  // emitted in the operation's creation microtask, or these two disagree.
  const allocating = detox.allocateDevice({ type: 'ios.simulator', onProgress: viaOption });
  // `on()` returns the operation, which is itself a promise — hence the `void`.
  void allocating.on('progress', viaSubscription);
  await using device = await allocating;

  assert.deepEqual(
    viaSubscription.mock.calls.map(({ arguments: [event] }) => event.name),
    viaOption.mock.calls.map(({ arguments: [event] }) => event.name),
    'expected a subscription made right after the call to see every event',
  );

  // A handle taken but not awaited yet must not become an unhandled rejection:
  // that kills the whole test process.
  const doomed = device.boot({ signal: AbortSignal.abort() });
  await new Promise((resolve) => setTimeout(resolve, 50));
  await assert.rejects(doomed, (error: Error) => error.name === 'AbortError');
});

/**
 * Signals compose rather than stack up: the session's signal reaches a call
 * that never received one of its own.
 */
test('aborting the session aborts calls in flight', async (t) => {
  await using server = await startServer({ signal: t.signal });
  const session = new AbortController();
  const detox = await connect({ server: server.address, signal: session.signal });

  const allocating = detox.allocateDevice({ type: 'ios.simulator' });
  session.abort();

  await assert.rejects(allocating, (error: Error) => error.name === 'AbortError');
});
