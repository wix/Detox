'use strict';

/**
 * spec015-fake-driver — the driver seam's executable definition (spec 015,
 * Fixture policy). A workspace package the server imports by name like any
 * driver, in plain CommonJS because the server is a CJS bundle spawned with
 * plain `node` (no TypeScript loader).
 *
 * It hands out pretend devices from a fixed roster (no processes, no
 * simulators), boots instantly, keeps install/launch/terminate as
 * bookkeeping, owns a REAL per-device gateway (the shared library handed in
 * on the toolkit, so the frozen dialect is spoken for real), and provides no
 * `setLocation` — spec 015 test 3's typed-refusal assertion. It runs without
 * Xcode; its own unit tests are the CI-runnable proof of the seam.
 *
 * `createDriver(toolkit)` is the one export a driver package must have. The
 * toolkit carries `appGateway.listen()` (the gateway library), `errors` (the
 * typed refusal the wire understands), `log`, and the server's `maxPool`. The driver answers `allocate(query) → lease`; the pool,
 * the ids, the state vocabulary and the wire descriptor are all its own
 * (here: `{ id }` — nothing about it is a udid).
 */

/** A fixed roster of at least two pretend devices (spec 015 Fixture policy). */
const ROSTER = [
  { id: 'spec015-fake-a', name: 'Fake Device A' },
  { id: 'spec015-fake-b', name: 'Fake Device B' },
  { id: 'spec015-fake-c', name: 'Fake Device C' },
];

function createDriver(toolkit) {
  /** id -> { apps } — the device object, alive while the device is booted. */
  const devices = new Map();
  /** id -> allocationId — who holds it right now. */
  const held = new Map();
  /** id -> Set(appPath) — install bookkeeping, nothing physical. */
  const installed = new Map();

  async function bootDevice(id) {
    let existing = devices.get(id);
    if (existing) return existing;
    // A real per-device gateway from the shared library — ephemeral port (no
    // native default to prefer), the id carried for its session payloads,
    // and the identity session-id decoding (this fixture does not compose).
    const apps = await toolkit.appGateway.listen({ deviceId: id });
    existing = { apps };
    devices.set(id, existing);
    return existing;
  }

  async function shutdownDevice(id) {
    const existing = devices.get(id);
    if (!existing) return false;
    devices.delete(id);
    try {
      await existing.apps.close();
    } catch (err) {
      toolkit.log.error('spec015-fake-driver: gateway close failed: ' + String(err));
    }
    return true;
  }

  /** The wire's `device` query is the driver's own; the fake reads an optional id/name narrowing. */
  function matches(query, device) {
    if (!query || typeof query !== 'object') return true;
    if (typeof query.id === 'string' && query.id && device.id !== query.id) return false;
    if (typeof query.name === 'string' && query.name && device.name !== query.name) return false;
    return true;
  }

  /** The typed refusals the core expects of a driver: the toolkit's own error class, so the wire sees the code. */
  const { DetoxError, DetoxErrorCode } = toolkit.errors;
  function refuse(code, message, details) {
    return new DetoxError(message, { code, details });
  }

  function lease(device, allocationId, bootedHere) {
    let stateListener;
    const object = devices.get(device.id);
    return {
      id: device.id,
      info: { device: { id: device.id }, name: device.name, os: 'FakeOS 1.0' },
      get apps() {
        return (devices.get(device.id) || object).apps;
      },
      release() {
        if (held.get(device.id) === allocationId) held.delete(device.id);
      },
      async discard() {
        if (held.get(device.id) !== allocationId) return;
        held.delete(device.id);
        // Only a device this lease brought up goes down with it: a warm
        // device's app is there for the next owner.
        if (!bootedHere) return;
        await shutdownDevice(device.id);
        if (stateListener) stateListener('shutdown');
      },
      onStateChange(listener) {
        stateListener = listener;
      },
      async boot(args) {
        const wasBooted = devices.has(device.id);
        if (!wasBooted && args && typeof args.onBootStart === 'function') args.onBootStart();
        await bootDevice(device.id);
        if (!wasBooted && stateListener) stateListener('booted');
        return !wasBooted;
      },
      async shutdown() {
        const was = await shutdownDevice(device.id);
        if (was && stateListener) stateListener('shutdown');
        return was;
      },
      // App verbs — bookkeeping only (no processes, no simulators).
      async install(args) {
        let set = installed.get(device.id);
        if (!set) {
          set = new Set();
          installed.set(device.id, set);
        }
        set.add(args.appPath);
      },
      async launch(args) {
        // No process to spawn: this fixture's apps dial in on their own (spec 015
        // test 3). The spawn hook is honoured for the seam's shape; a synthetic
        // pid keeps the launch-result shape honest.
        if (args && typeof args.onSpawn === 'function') args.onSpawn();
        return { pid: 0 };
      },
      async terminate(_args) {
        // Bookkeeping only.
      },
      // Deliberately NO `setLocation` (and no other device utilities): an absent
      // capability is a typed `DETOX_NOT_IMPLEMENTED` refusal, which spec 015
      // test 3 asserts — never a live-looking no-op.
    };
  }

  return {
    async allocate({ allocationId, device: query, requestedType, signal, onBootStart }) {
      if (signal && signal.aborted) throw signal.reason;
      const matching = ROSTER.filter((device) => matches(query, device));
      if (matching.length === 0) {
        // What frozen 002 pins for a query nothing can satisfy.
        throw refuse(DetoxErrorCode.DETOX_NO_MATCHING_DEVICE, 'No fake device matches ' + JSON.stringify(query || {}), { query, requestedType });
      }
      const free = matching.find((device) => !held.has(device.id));
      if (!free) {
        // Every match is held; the holders are named like the real pool does.
        throw refuse(DetoxErrorCode.DETOX_POOL_EXHAUSTED, 'Every fake device matching ' + JSON.stringify(query || {}) + ' is busy', {
          maxPool: toolkit.maxPool,
          holders: matching.map((device) => ({ allocationId: held.get(device.id), udid: device.id, ageMs: 0 })),
        });
      }
      // Claimed before the boot so a concurrent allocate cannot pick the same
      // device; unclaimed if the boot (the gateway) fails — nothing left behind.
      held.set(free.id, allocationId);
      const wasBooted = devices.has(free.id);
      if (!wasBooted && typeof onBootStart === 'function') onBootStart();
      try {
        await bootDevice(free.id);
      } catch (err) {
        held.delete(free.id);
        throw err;
      }
      return lease(free, allocationId, !wasBooted);
    },

    async close() {
      for (const id of [...devices.keys()]) await shutdownDevice(id);
    },
  };
}

module.exports = { createDriver };
