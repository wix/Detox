/**
 * Ground truth about simulators, obtained without going through the client.
 *
 * Used to hit a device with a hammer from outside Detox and then check that the
 * client noticed — an implementation that only ever updates `device.state` from
 * its own calls cannot pass that.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

/** Shuts a simulator down behind the client's back. */
export async function shutdownSimulatorExternally(
  udid: string,
  signal?: AbortSignal,
): Promise<void> {
  await run('xcrun', ['simctl', 'shutdown', udid], { signal });
}

/** Boots a simulator behind the client's back — a "foreign boot". */
export async function bootSimulatorExternally(
  udid: string,
  signal?: AbortSignal,
): Promise<void> {
  await run('xcrun', ['simctl', 'boot', udid], { signal });
}

/** Deletes a simulator outright. Test cleanup only — never an assertion path. */
export async function deleteSimulatorExternally(
  udid: string,
  signal?: AbortSignal,
): Promise<void> {
  await run('xcrun', ['simctl', 'delete', udid], { signal });
}

/** A simulator created by {@link createSimulatorExternally} — a disposable fixture. */
export interface CreatedSimulator {
  readonly udid: string;
  readonly name: string;
}

/**
 * Creates a throwaway simulator for tests that must mutate device *content*
 * (erase, app installs, keychain, status bar). Stock simulators on this Mac
 * belong to a human; a probe starts clean, nobody misses what a test does to
 * it, and the caller deletes it in `finally`. Any leftover with the same name
 * (a crashed previous run) is deleted first, so probes never accumulate.
 *
 * Uses the newest iPhone device type and the default (newest) runtime — the
 * probe's shape is irrelevant to every caller; only its disposability matters.
 */
export async function createSimulatorExternally(
  name: string,
  signal?: AbortSignal,
): Promise<CreatedSimulator> {
  for (const sim of await listSimulators(signal)) {
    if (sim.name === name) await deleteSimulatorExternally(sim.udid, signal);
  }
  const deviceType = (await listDeviceTypeNames(signal)).find((typeName) =>
    typeName.startsWith('iPhone'),
  );
  if (!deviceType) throw new Error('precondition: no iPhone device type on this Mac');
  const { stdout } = await run('xcrun', ['simctl', 'create', name, deviceType], { signal });
  return { udid: stdout.trim(), name };
}

/**
 * The app's container path if the bundle is installed, else null — simctl's
 * own ground truth for "did the install really happen" (spec 007). An install
 * that only produced a green RPC answer is not an install; `get_app_container`
 * exits non-zero for an unknown bundle, which maps to null here.
 */
export async function appContainerPathExternally(
  udid: string,
  bundleId: string,
  signal?: AbortSignal,
): Promise<string | null> {
  try {
    const { stdout } = await run(
      'xcrun',
      ['simctl', 'get_app_container', udid, bundleId, 'app'],
      { signal },
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Raw `simctl status_bar <udid> list` output — the ground truth a status-bar
 * override test asserts against. An override that only lives in the server's
 * memory is not an override.
 */
export async function statusBarOverrides(udid: string, signal?: AbortSignal): Promise<string> {
  const { stdout } = await run('xcrun', ['simctl', 'status_bar', udid, 'list'], { signal });
  return stdout;
}

/**
 * Launches an app on the simulator from outside the client — fixture
 * preparation (e.g. warming a cold Safari before `openURL`: the very first
 * open after boot can outlive `simctl openurl`'s own ack timeout while the
 * URL still lands late), never an assertion path.
 */
export async function launchAppExternally(
  udid: string,
  bundleId: string,
  signal?: AbortSignal,
): Promise<void> {
  await run('xcrun', ['simctl', 'launch', udid, bundleId], { signal });
}

/**
 * Terminates an app behind the client's back — fixture cleanup, never an
 * assertion path. Tolerant of "not running": cleanup must not invent
 * failures.
 */
export async function terminateAppExternally(
  udid: string,
  bundleId: string,
  signal?: AbortSignal,
): Promise<void> {
  await run('xcrun', ['simctl', 'terminate', udid, bundleId], { signal }).catch(() => undefined);
}

/**
 * The simulator's biometric-enrollment state, read back from the device
 * itself: enrollment is a persistent Darwin notify state
 * (`com.apple.BiometricKit.enrollmentChanged`), so `notifyutil -g` is ground
 * truth for `setBiometricEnrollment`. Face/finger match events are one-shot
 * notifications, not state — they have no readback and cannot be gated this
 * way.
 */
export async function biometricEnrollmentState(
  udid: string,
  signal?: AbortSignal,
): Promise<'0' | '1'> {
  const { stdout } = await run(
    'xcrun',
    ['simctl', 'spawn', udid, 'notifyutil', '-g', 'com.apple.BiometricKit.enrollmentChanged'],
    { signal },
  );
  const state = /com\.apple\.BiometricKit\.enrollmentChanged\s+([01])\b/.exec(stdout)?.[1];
  if (state !== '0' && state !== '1') {
    throw new Error(`unexpected notifyutil output: ${stdout.trim()}`);
  }
  return state;
}

/** One simulator as `simctl list` reports it. */
export interface SimulatorListing {
  readonly udid: string;
  /** Display name, e.g. `iPhone 17` — usually the model, but renameable. */
  readonly name: string;
  /** The device type, e.g. `com.apple.CoreSimulator.SimDeviceType.iPhone-17` —
   * what a `byType` query actually matches, rename-proof. */
  readonly deviceTypeIdentifier?: string;
  readonly state: string;
  readonly isAvailable: boolean;
}

/**
 * Every simulator on this Mac, including unavailable and mid-creation ones —
 * ground truth for discovery *and* for spotting half-made leftovers, so it
 * does not filter.
 */
export async function listSimulators(signal?: AbortSignal): Promise<SimulatorListing[]> {
  const { stdout } = await run('xcrun', ['simctl', 'list', 'devices', '-j'], { signal });
  const parsed = JSON.parse(stdout) as SimctlFullDeviceList;
  return Object.values(parsed.devices).flatMap((devices) =>
    devices.map((device) => ({
      udid: device.udid,
      name: device.name,
      deviceTypeIdentifier: device.deviceTypeIdentifier,
      state: device.state,
      isAvailable: device.isAvailable !== false,
    })),
  );
}

interface SimctlDeviceType {
  name: string;
  identifier: string;
}

interface SimctlDeviceTypeList {
  devicetypes: SimctlDeviceType[];
}

/** Device type names (e.g. `iPhone 16 Pro`) in simctl's own order (newest first). */
export async function listDeviceTypeNames(signal?: AbortSignal): Promise<string[]> {
  const { stdout } = await run('xcrun', ['simctl', 'list', 'devicetypes', '-j'], { signal });
  const parsed = JSON.parse(stdout) as SimctlDeviceTypeList;
  return parsed.devicetypes.map((deviceType) => deviceType.name);
}

/** Device types as identifier → display name — the name is what `byType` queries speak. */
export async function listDeviceTypes(signal?: AbortSignal): Promise<Map<string, string>> {
  const { stdout } = await run('xcrun', ['simctl', 'list', 'devicetypes', '-j'], { signal });
  const parsed = JSON.parse(stdout) as SimctlDeviceTypeList;
  return new Map(parsed.devicetypes.map((deviceType) => [deviceType.identifier, deviceType.name]));
}

/** What `simctl` itself thinks the device is doing, e.g. `Booted`/`Shutdown`. */
export async function simulatorState(udid: string, signal?: AbortSignal): Promise<string> {
  const { stdout } = await run('xcrun', ['simctl', 'list', 'devices', '-j'], { signal });
  const parsed = JSON.parse(stdout) as SimctlDeviceList;
  for (const devices of Object.values(parsed.devices)) {
    for (const device of devices) {
      if (device.udid === udid) return device.state;
    }
  }
  throw new Error(`simctl does not know a device with udid ${udid}`);
}

interface SimctlDevice {
  udid: string;
  state: string;
}

interface SimctlDeviceList {
  devices: Record<string, SimctlDevice[]>;
}

interface SimctlFullDevice extends SimctlDevice {
  name: string;
  deviceTypeIdentifier?: string;
  isAvailable?: boolean;
}

interface SimctlFullDeviceList {
  devices: Record<string, SimctlFullDevice[]>;
}

/**
 * A model with exactly one available simulator, served cold.
 *
 * The single-candidate trick doing double duty: the query makes the pick
 * deterministic (selection order is contractually unspecified), and a cold
 * candidate guarantees the allocation performs a real boot, so the implicit
 * `boot` child operation exists — a warm handoff reports no boot, so a test
 * asserting the implicit boot must ask for a device that needs one.
 *
 * Cold-pinned, not merely cold-selected: an already-cold single is
 * preferred; otherwise the first eligible single is shut down and waited
 * physically cold here, rather than handing the caller a warm device that
 * would flake the boot assertion. The wait is the gate, not the shutdown
 * call: `simctl shutdown` returns while the listing still says
 * `Shutting Down`.
 */
export async function shutdownSingleModel(signal?: AbortSignal): Promise<string> {
  // Grouped by device type, never by display name: a `byType` query matches
  // every simulator of the type, including renamed and registry-created ones
  // — the spec-005 reset test leaves a `detox-spec005-reset` device behind
  // (completed creations are never deleted), and a name-keyed
  // count would call its type "single" while the server saw two candidates
  // and warm-picked the one this helper never cooled.
  const typeNames = await listDeviceTypes(signal);
  const byType = new Map<string, { udid: string; state: string; count: number }>();
  for (const sim of await listSimulators(signal)) {
    if (!sim.isAvailable || sim.deviceTypeIdentifier === undefined) continue;
    const entry = byType.get(sim.deviceTypeIdentifier);
    if (entry) entry.count += 1;
    else byType.set(sim.deviceTypeIdentifier, { udid: sim.udid, state: sim.state, count: 1 });
  }
  const singles = [...byType.entries()].flatMap(([typeId, entry]) => {
    const model = typeNames.get(typeId);
    return model !== undefined && /^(iPhone|iPad)/.test(model) && entry.count === 1
      ? [{ model, entry }]
      : [];
  });
  const cold = singles.find((candidate) => candidate.entry.state === 'Shutdown');
  if (cold) return cold.model;
  const first = singles[0];
  if (!first) {
    throw new Error('precondition: no single-simulator iPhone/iPad device type on this Mac');
  }
  if (first.entry.state !== 'Shutting Down') {
    await shutdownSimulatorExternally(first.entry.udid, signal);
  }
  await waitUntil(async () => (await simulatorState(first.entry.udid, signal)) === 'Shutdown', {
    signal,
    description: `${first.model} to settle cold before serving as a fixture`,
  });
  return first.model;
}

/**
 * Polls until `predicate` holds — sync or async. Aborting (or the test
 * timing out) rejects: a state that never arrives must fail loudly.
 */
export async function waitUntil(
  predicate: () => boolean | Promise<boolean>,
  options: WaitUntilOptions = {},
): Promise<void> {
  const { timeoutMs = 30_000, intervalMs = 100, signal, description = 'condition' } = options;
  const deadline = Date.now() + timeoutMs;
  while (!(await predicate())) {
    signal?.throwIfAborted();
    if (Date.now() > deadline) {
      throw new Error(`timed out after ${String(timeoutMs)}ms waiting for ${description}`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

export interface WaitUntilOptions {
  timeoutMs?: number;
  intervalMs?: number;
  signal?: AbortSignal;
  description?: string;
}
