/**
 * Acceptance criterion for spec 004.
 *
 * This file is frozen and append-only. It speaks only the public dialect:
 * `detox/client` — never `@detox-remote/*`. The only other import allowed is
 * `./helpers/*`, which is test scaffolding, not product API.
 *
 * The contract is `.name` — the class, which is also the only signal that
 * survives a Jest reporter's serialization — plus `.code` from the published
 * `DetoxErrorCode` map, which is what in-process code branches on. The map is
 * imported rather than restated here, so an implementation cannot satisfy these
 * tests while exporting different numbers.
 *
 * Message text is never inspected beyond existence: classifying by prose is
 * the anti-pattern this spec retires.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { connect, DetoxErrorCode } from 'detox/client';

import { startServer } from './helpers/server';
import { assertDetoxError, rejectionOf } from './helpers/errors';

test('exhaustion is typed, names the holder across connections, and is honest', async (t) => {
  // A private one-slot server, and two sessions on it: contention between two
  // *connections* is the case "name the holders" exists for. A server that
  // only knows its own caller's allocations passes a single-client test and
  // reports nobody on the shared LAN server that is the deployment.
  await using server = await startServer({ dedicated: true, maxPool: 1, signal: t.signal });
  await using owner = await connect({ server: server.address, signal: t.signal });
  await using bystander = await connect({ server: server.address, signal: t.signal });

  await using held = await owner.allocateDevice({ type: 'ios.simulator' });
  assert.ok(held.info.udid.length > 0);

  const err = assertDetoxError(
    await rejectionOf(bystander.allocateDevice({ type: 'ios.simulator' }), 'second session'),
    'exhaustion',
  );
  assert.equal(err.name, 'DevicePoolExhaustedError');
  assert.equal(err.code, DetoxErrorCode.DETOX_POOL_EXHAUSTED);

  // Structured, never prose: enough to act on without reading a sentence.
  assert.equal(err.details?.maxPool, 1, 'expected the cap that was hit');
  const holders = err.details?.holders;
  assert.ok(Array.isArray(holders) && holders.length === 1, 'expected exactly one holder');
  const holder = holders[0] as Record<string, unknown>;
  assert.equal(typeof holder.allocationId, 'string');
  assert.equal(holder.udid, held.info.udid, 'expected the holder to name the device it holds');
  assert.equal(typeof holder.ageMs, 'number');

  // Transience is a fact, not a self-declared flag — and the release has to be
  // visible to the *other* session, not just to the one that let go.
  await held.release();
  await using second = await bystander.allocateDevice({ type: 'ios.simulator' });
  assert.ok(second.info.udid.length > 0, 'expected the retry after release to succeed');
});

test('terminal beats transient: no-match wins on a full pool', async (t) => {
  await using server = await startServer({ dedicated: true, maxPool: 1, signal: t.signal });
  await using detox = await connect({ server: server.address, signal: t.signal });

  const impossible = { type: 'ios.simulator' as const, device: { model: 'iPhone 99 Ultra Nonexistent' } };

  // The pool is FULL — the exact configuration where a capacity-first check
  // reports exhaustion for a query nothing can ever satisfy. The only order
  // that satisfies this test and the previous one is: match first, cap second.
  await using held = await detox.allocateDevice({ type: 'ios.simulator' });
  assert.ok(held.info.udid.length > 0);
  const onFull = assertDetoxError(
    await rejectionOf(detox.allocateDevice(impossible), 'impossible query, full pool'),
    'no-match (full)',
  );
  assert.equal(onFull.name, 'NoMatchingDeviceError');
  assert.equal(onFull.code, DetoxErrorCode.DETOX_NO_MATCHING_DEVICE);
  assert.notEqual(
    onFull.code,
    DetoxErrorCode.DETOX_POOL_EXHAUSTED,
    'a query nothing can satisfy must not be reported as a full pool',
  );
  assert.ok(onFull.details?.query, 'expected the query echoed in details');

  // Same query against a free pool: identical answer — precedence is not the
  // only path to the terminal code.
  await held.release();
  const onFree = assertDetoxError(
    await rejectionOf(detox.allocateDevice(impossible), 'impossible query, free pool'),
    'no-match (free)',
  );
  assert.equal(onFree.code, DetoxErrorCode.DETOX_NO_MATCHING_DEVICE);
});

test('aborted stays aborted, with the abort reason as cause', async (t) => {
  await using server = await startServer({ signal: t.signal });
  await using detox = await connect({ server: server.address, signal: t.signal });

  const controller = new AbortController();
  const reason = new Error('spec-004 abort reason');
  const pending = detox.allocateDevice({
    type: 'ios.simulator',
    signal: controller.signal,
    onProgress: () => controller.abort(reason),
  });

  const err = assertDetoxError(await rejectionOf(pending, 'aborted allocation'), 'aborted');
  // The name and the `cause` contract are frozen by spec 001; the code is
  // what this spec adds. An error displaced by the abort travels further down
  // the chain — it may never take this slot.
  assert.equal(err.name, 'AbortError');
  assert.equal(err.code, DetoxErrorCode.DETOX_ABORTED);
  assert.equal(err.cause, reason, 'expected the abort reason as cause');
});

test('turned away is not nobody home', async (t) => {
  // Wrong token: the server answers, and says no.
  await using server = await startServer({
    signal: t.signal,
    headers: { Authorization: 'Bearer definitely-not-the-token' },
  });
  const unauthorized = assertDetoxError(
    await rejectionOf(connect({ server: server.address, signal: t.signal }), 'wrong token'),
    'unauthorized',
  );
  assert.equal(unauthorized.name, 'DetoxConnectionError');
  assert.equal(unauthorized.code, DetoxErrorCode.DETOX_UNAUTHORIZED);
  assert.equal(unauthorized.details?.status, 401, 'expected the refusal status in details');

  // Dead address: nobody answers at all.
  const deadUrl = 'ws://127.0.0.1:9';
  const unreachable = assertDetoxError(
    await rejectionOf(connect({ server: { url: deadUrl }, signal: t.signal }), 'dead address'),
    'unreachable',
  );
  assert.equal(unreachable.name, 'DetoxConnectionError');
  assert.equal(unreachable.code, DetoxErrorCode.DETOX_SERVER_UNREACHABLE);
  assert.equal(unreachable.details?.url, deadUrl, 'expected the dial target in details');

  // One class may cover a family: the class is the coarse signal a serialized
  // reporter still sees, the code is the fine one in-process code branches on.
  assert.notEqual(unauthorized.code, unreachable.code, 'the two refusals must differ structurally');
});

test('a dying server speaks its code', async (t) => {
  const server = await startServer({ dedicated: true, signal: t.signal });
  const detox = await connect({ server: server.address, signal: t.signal });
  try {
    // Deliberately NOT `await using`: the server this device lives on is about
    // to die, so a disposal-time release could only throw over the assertion
    // that matters. Nothing to leak — the allocation dies with the server.
    const device = await detox.allocateDevice({ type: 'ios.simulator' });

    // A slow call in flight when the server goes down. `boot` on a booted
    // device is idempotent-fast, so cycle down first to make boot do work.
    await device.shutdown();
    // Adopted into a plain Promise: the handle is PromiseLike by design, and
    // the rejection must have a handler before the server dies mid-flight.
    const inFlight = Promise.resolve(device.boot());
    inFlight.catch(() => {
      /* asserted below; not an unhandled rejection meanwhile */
    });
    await server.stop();

    const err = assertDetoxError(await rejectionOf(inFlight, 'boot across server death'), 'connection-lost');
    assert.equal(err.name, 'DetoxConnectionError');
    assert.equal(err.code, DetoxErrorCode.DETOX_CONNECTION_LOST);
    // The WebSocket close code is a *detail*, never a second classification
    // axis — which is also why it may sit next to `.code` without either being
    // mistakable for the other.
    assert.equal(typeof err.details?.closeCode, 'number', 'expected the close code in details');
  } finally {
    // The session is already dead; teardown must be quiet about it.
    await Promise.resolve(detox[Symbol.asyncDispose]()).catch(() => undefined);
    await server.stop();
  }
});

test('a code with no class of its own rides the base class', async (t) => {
  await using server = await startServer({ signal: t.signal });
  await using detox = await connect({ server: server.address, signal: t.signal });

  const device = await detox.allocateDevice({ type: 'ios.simulator' });
  const allocationId = device.info.allocationId;
  await device.release();

  // A released handle is stale; using it is an error with a code — carried by
  // plain DetoxError, no dedicated subclass. This is the same path an unknown
  // code from a newer server takes, minus the fake peer (unit level).
  const err = assertDetoxError(await rejectionOf(device.boot(), 'boot on released handle'), 'stale');
  assert.equal(err.name, 'DetoxError');
  assert.equal(err.code, DetoxErrorCode.DETOX_STALE_HANDLE);
  assert.equal(err.details?.allocationId, allocationId, 'expected the stale handle named in details');
});
