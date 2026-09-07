/**
 * Acceptance: spec 007 — the build upload lane.
 *
 * This file is frozen and append-only.
 *
 * Style is part of the contract: tests are STRAIGHT-LINE — a fence of awaits
 * against the public dialect plus the editable helpers, no function
 * definitions in this file. No typed door is used: the lane adds no new
 * public API — `device.installApp(path)` keeps its exact spelling, and
 * everything new lives beneath it.
 *
 * Scope: this file carries ONLY the user-facing story — a user installs an
 * app; bytes travel at most once; the server's store outlives the server.
 * The lane's raw wire contract (digest-verified PUT, auth, crash safety of
 * interrupted uploads, byte-budget LRU eviction) is NOT user-facing and is
 * covered by integration tests instead, with `specs/helpers/blob-lane.ts`
 * as the reference client.
 *
 * Both tests prove installs by simctl's own ground truth
 * (`get_app_container`) — no launch, no fake app: "install → launch" is
 * already frozen in spec 003 (its URL-install test exercises the same
 * unpack+install path).
 *
 * Observability caveat: the accept harness runs client and server on ONE
 * machine, so "the server got the bytes over the wire, not off the shared
 * disk" has exactly one observable trace — the server's own
 * freshly-stored-blob log line, counted through the editable
 * `countBlobStores` (the count is frozen, the wording is not). The true
 * two-machine proof is a manual run against a second Mac, not something
 * `yarn accept` can stage.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { connect } from 'detox/client';

import { startServer } from './helpers/server';
import { buildStubAppExternally } from './helpers/apps';
import { countBlobStores } from './helpers/blob-lane';
import {
  appContainerPathExternally,
  createSimulatorExternally,
  deleteSimulatorExternally,
  shutdownSimulatorExternally,
} from './helpers/simctl';

/**
 * Test 1 — the lane replaces the server-read path: bytes travel
 * client→server exactly once per distinct build.
 *
 * `device.installApp(<path to a .app bundle>)` — the same public spelling as
 * always — must now move the build's bytes through the blob lane: after one
 * install the server reports exactly ONE freshly stored blob, and the app is
 * REALLY installed — `simctl get_app_container` names its container.
 * Reinstalling the SAME unchanged build must store NOTHING new — content
 * addressing means a returning build is a hash check, not a transfer — and
 * the container must still be there. This also pins that the client's
 * archive recipe is deterministic for an unchanged tree: were it not, the
 * second install would store a second blob and the count would catch it.
 */
test('installApp pushes bytes through the lane once; an unchanged build re-installs without re-upload', async (t) => {
  const probe = await createSimulatorExternally('detox-spec007-lane', t.signal);
  const bundleId = 'com.detox.spec007.lane';
  try {
    await using server = await startServer({ dedicated: true, isolatedBlobStore: true, signal: t.signal });
    await using detox = await connect({ server: server.address, signal: t.signal });
    await using device = await detox.allocateDevice({
      type: 'ios.simulator',
      device: { deviceId: probe.udid },
    });
    const appPath = await buildStubAppExternally(bundleId, t.signal);

    await device.installApp(appPath);
    assert.equal(
      countBlobStores(server.logs()),
      1,
      'one install of one build stores exactly one blob',
    );
    assert.ok(
      await appContainerPathExternally(probe.udid, bundleId, t.signal),
      "simctl's own ground truth: the app container exists — the upload really installed",
    );

    await device.installApp(appPath);
    assert.equal(
      countBlobStores(server.logs()),
      1,
      'reinstalling the unchanged build stores nothing new — the content hash already lives on the server',
    );
    assert.ok(
      await appContainerPathExternally(probe.udid, bundleId, t.signal),
      'the deduplicated install is still a real install',
    );
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});

/**
 * Test 2 — the store SURVIVES a server restart. Burning it would make every
 * restart re-upload every build on the farm; bytes under a hash may persist
 * across restarts — only the belief that an app is installed may not.
 *
 * The sequence closes every other explanation: the app is UNINSTALLED under
 * the second server (container verifiably gone), then installed again — and
 * the second server's whole life stores ZERO blobs while the container
 * comes back. The bytes that produced that container had exactly one
 * possible source: the store the first server filled before it died.
 */
test('the blob store survives a server restart: the returning build reinstalls with zero uploads', async (t) => {
  const probe = await createSimulatorExternally('detox-spec007-restart', t.signal);
  const bundleId = 'com.detox.spec007.restart';
  try {
    const serverA = await startServer({ dedicated: true, isolatedBlobStore: true, signal: t.signal });
    const storeRoot = serverA.blobRoot;
    assert.ok(storeRoot, 'the helper reports the isolated store root it minted');
    const appPath = await buildStubAppExternally(bundleId, t.signal);
    {
      await using detox = await connect({ server: serverA.address, signal: t.signal });
      await using device = await detox.allocateDevice({
        type: 'ios.simulator',
        device: { deviceId: probe.udid },
      });
      await device.installApp(appPath);
      assert.equal(countBlobStores(serverA.logs()), 1, 'the first life stores the build once');
    }
    await serverA.stop();

    await using serverB = await startServer({ dedicated: true, blobRoot: storeRoot, signal: t.signal });
    await using detox = await connect({ server: serverB.address, signal: t.signal });
    await using device = await detox.allocateDevice({
      type: 'ios.simulator',
      device: { deviceId: probe.udid },
    });
    await device.uninstallApp(bundleId);
    assert.equal(
      await appContainerPathExternally(probe.udid, bundleId, t.signal),
      null,
      'the app is verifiably gone from the device before the reinstall',
    );
    await device.installApp(appPath);
    assert.equal(
      countBlobStores(serverB.logs()),
      0,
      'the second life never stores a blob — the hash check hit the surviving store',
    );
    assert.ok(
      await appContainerPathExternally(probe.udid, bundleId, t.signal),
      'the container is back, and the only possible source of its bytes is the store the dead server filled',
    );
  } finally {
    await shutdownSimulatorExternally(probe.udid).catch(() => undefined);
    await deleteSimulatorExternally(probe.udid).catch(() => undefined);
  }
});
