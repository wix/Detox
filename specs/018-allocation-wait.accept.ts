/**
 * Acceptance criterion for spec 018.
 *
 * This file is frozen and append-only. It speaks only the public dialect:
 * `detox/client` — never `@detox-remote/*`. The only other import allowed is
 * `./helpers/*`, which is test scaffolding, not product API.
 *
 * What is under test is patience, so both tests measure time. Neither pins
 * the poll period: one asserts the refusal is not delivered before the window
 * closes, the other that a slot freed mid-wait is picked up well inside it.
 * An implementation that slept out the window and then refused would pass the
 * first test and fail the second — which is why the second exists.
 *
 * Spec 004 already owns the no-window case (one attempt, instant refusal);
 * nothing here restates it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';

import { connect, DetoxErrorCode } from 'detox/client';

import { startServer } from './helpers/server';
import { assertDetoxError, rejectionOf } from './helpers/errors';

/** Short enough to keep the suite quick, long enough to outlast a poll or two. */
const WINDOW_MS = 10_000;
/** How long the owner holds the only device in the release test. */
const HOLD_MS = 2_000;

test('a waiting allocation outlasts the window, then refuses with what it waited', async (t) => {
  // One slot, two connections: the waiter's patience must be visible across
  // sessions, exactly as the exhaustion it is waiting out is (spec 004).
  await using server = await startServer({ dedicated: true, maxPool: 1, signal: t.signal });
  await using owner = await connect({ server: server.address, signal: t.signal });
  await using waiter = await connect({
    server: server.address,
    allocationTimeout: WINDOW_MS,
    signal: t.signal,
  });

  await using held = await owner.allocateDevice({ type: 'ios.simulator' });
  assert.ok(held.info.udid.length > 0);

  const startedAt = Date.now();
  const err = assertDetoxError(
    await rejectionOf(waiter.allocateDevice({ type: 'ios.simulator' }), 'the waiter'),
    'exhaustion after the window',
  );
  const elapsedMs = Date.now() - startedAt;

  // The window changes when the answer arrives, never which answer it is.
  assert.equal(err.name, 'DevicePoolExhaustedError');
  assert.equal(err.code, DetoxErrorCode.DETOX_POOL_EXHAUSTED);
  assert.ok(
    elapsedMs >= WINDOW_MS,
    `expected the refusal no sooner than the ${String(WINDOW_MS)}ms window, got ${String(elapsedMs)}ms`,
  );

  // Structured, never prose: the caller can tell a waited-out refusal from an
  // instant one without reading the sentence.
  const waitedMs = err.details?.waitedMs;
  assert.equal(typeof waitedMs, 'number', 'expected details.waitedMs on a waited-out refusal');
  assert.ok(
    (waitedMs as number) >= WINDOW_MS,
    `expected details.waitedMs to cover the window, got ${String(waitedMs)}`,
  );
});

test('a slot freed mid-wait is picked up, well inside the window', async (t) => {
  await using server = await startServer({ dedicated: true, maxPool: 1, signal: t.signal });
  await using owner = await connect({ server: server.address, signal: t.signal });
  await using waiter = await connect({
    server: server.address,
    allocationTimeout: WINDOW_MS,
    signal: t.signal,
  });

  await using held = await owner.allocateDevice({ type: 'ios.simulator' });
  const heldUdid = held.info.udid;

  // Started, not awaited: the wait has to be in flight while the owner still
  // holds the only device — that is the whole scenario.
  const startedAt = Date.now();
  const pending = waiter.allocateDevice({ type: 'ios.simulator' });

  await sleep(HOLD_MS, undefined, { signal: t.signal });
  await held.release();

  await using got = await pending;
  const elapsedMs = Date.now() - startedAt;

  assert.equal(got.info.udid, heldUdid, 'expected the freed device, not a second one');
  assert.ok(
    elapsedMs >= HOLD_MS,
    `expected the waiter to have actually waited for the release, got ${String(elapsedMs)}ms`,
  );
  assert.ok(
    elapsedMs < WINDOW_MS,
    `expected the freed slot inside the ${String(WINDOW_MS)}ms window, got ${String(elapsedMs)}ms`,
  );
});
