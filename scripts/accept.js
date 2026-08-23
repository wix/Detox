#!/usr/bin/env node
'use strict';

/**
 * yarn accept <NNN>
 *
 * Resolves specs/<NNN>*.accept.ts, builds, spawns a Detox Server on the URL the
 * accept file expects (DETOX_SERVER_URL, default ws://localhost:3456), runs the
 * accept file through node:test with TypeScript support (tsx), tears the server
 * down even on failure, and propagates the test exit code.
 *
 * The runner also cools the simulators the run booted (and only those): the
 * suites' cold-fixture tests consume shut-down singles without returning
 * them, and no single server life may shut down a boot it did not make.
 */

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const os = require('os');
const { execFileSync } = require('child_process');
const { randomBytes } = require('crypto');

const { parseTap, verdict, formatCounts, ratchetFrom } = require('./lib/tap-census');
const {
  claimOrRefuse,
  sweepProbeSimulators,
  startLoadSampler,
  loadIsSuspect,
  onFatalSignal,
} = require('./lib/device-lane');
const { assertSupportedNode } = require('./lib/runtime');
const { productionFingerprint } = require('./lib/fingerprint');

const ROOT = path.resolve(__dirname, '..');
const SPECS_DIR = path.join(ROOT, 'specs');
const RECEIPT_FILE = path.join(ROOT, '.detox-accept-receipt.json');
/** The per-spec high-water mark. Tracked, unlike the receipt: an expectation
 *  that lives only on the machine that produced it cannot ratchet anything. */
const CENSUS_FILE = path.join(ROOT, '.detox-accept-census.json');

/**
 * Only ever called before the server is spawned. Inside the run, a refusal
 * must travel as a thrown value instead: `process.exit` skips `finally`,
 * and `finally` is the only thing that kills the server.
 */
function fail(message) {
  console.error(`[accept] ${message}`);
  process.exit(1);
}

function resolveSpec(nnn) {
  if (!nnn) {
    fail('usage: yarn accept <NNN>   (e.g. yarn accept 001)');
  }
  if (!fs.existsSync(SPECS_DIR)) {
    fail(`no specs/ directory at ${SPECS_DIR}`);
  }
  const suffix = '.accept.ts';
  const matches = fs
    .readdirSync(SPECS_DIR)
    .filter((f) => f.startsWith(nnn) && f.endsWith(suffix));
  if (matches.length === 0) {
    fail(`no acceptance file matching specs/${nnn}*.accept.ts`);
  }
  if (matches.length > 1) {
    fail(`ambiguous: multiple files match specs/${nnn}*.accept.ts -> ${matches.join(', ')}`);
  }
  return path.join(SPECS_DIR, matches[0]);
}

function serverPortFrom(url) {
  try {
    const parsed = new URL(url);
    if (parsed.port) return Number(parsed.port);
  } catch {
    /* fall through to default */
  }
  return 3456;
}

/**
 * The interface to bind. The server defaults to IPv4 loopback, so the URL the
 * spec dials has to resolve there too — hence `127.0.0.1` rather than
 * `localhost`, which on macOS resolves to `::1` first.
 */
function serverHostFrom(url) {
  try {
    return new URL(url).hostname || '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
}

function build() {
  console.log('[accept] yarn build ...');
  const result = spawnSync('yarn', ['build'], { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) {
    fail('build failed');
  }
}

function spawnServer(port, host, token) {
  const cli = path.join(ROOT, 'detox', 'dist', 'server', 'cli.js');
  if (!fs.existsSync(cli)) {
    fail(`server CLI not found at ${cli} (build did not produce it)`);
  }
  console.log(`[accept] starting server: node detox/dist/server/cli.js --port ${port} --host ${host}`);
  // The token travels in the environment, not on argv — a command line is
  // readable by every process on the machine.
  // DETOX_BLOB_ROOT (the @internal seam, spec 007): the runner's shared
  // server gets a throwaway blob store, so accept runs never write into —
  // or sweep the tmp/ of — the machine's real per-user store.
  const blobRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'detox-accept-blobs-'));
  // Removed after the server dies (killServer awaits the exit): a zipped
  // app bundle per run must not accumulate in /tmp.
  process.on('exit', () => {
    try {
      fs.rmSync(blobRoot, { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  });
  const server = spawn('node', [cli, '--port', String(port), '--host', host], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(port),
      DETOX_SERVER_TOKEN: token,
      DETOX_BLOB_ROOT: blobRoot,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  return server;
}

/** Resolve once the server logs it is listening, or exits, or a timeout fires. */
function waitForServer(server, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (why) => {
      if (settled) return;
      settled = true;
      resolve(why);
    };
    const timer = setTimeout(() => done('timeout'), timeoutMs);
    timer.unref?.();
    server.stdout.on('data', (d) => {
      if (/listening/i.test(String(d))) done('listening');
    });
    server.once('exit', (code) => done(`server exited early (code ${code})`));
  });
}

function runTest(specFile, env, tapFile, onSpawn) {
  return new Promise((resolve) => {
    // Node >= 18.19 accepts an explicit file path after --test; tsx is
    // preloaded via --import so the TypeScript spec runs directly. The
    // second reporter mirrors the run as TAP into a file so the receipt
    // gets machine-read test counts instead of a hand-read verdict.
    const args = [
      '--import', 'tsx',
      '--test',
      // A wedge detector, not a patience limit: node:test's
      // default per-test timeout is Infinity, so a test wedged on a lost
      // settlement (the spec-008 eternal-park shape) would hang the run
      // forever with no output. 10 minutes is far above any test here
      // (slowest recorded ~2 min under load); it exists only to make a
      // wedge die loudly.
      '--test-timeout=600000',
      '--test-reporter=spec', '--test-reporter-destination=stdout',
      '--test-reporter=tap', `--test-reporter-destination=${tapFile}`,
      specFile,
    ];
    console.log(`[accept] node ${args.join(' ')}`);
    const child = spawn('node', args, { cwd: ROOT, env, stdio: 'inherit' });
    onSpawn?.(child);
    child.on('exit', (code) => resolve(typeof code === 'number' ? code : 1));
  });
}

/**
 * The full census, not three of its seven counters: a bare
 * `fail ?? tests - pass` fallback is unreachable whenever node emits
 * `# fail 0`, which is the shape where a cancelled or vanished test hides.
 */
function readCensus(tapFile) {
  try {
    return parseTap(fs.readFileSync(tapFile, 'utf8'));
  } catch {
    return null;
  }
}

function gitHead() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

/** The whole per-spec expectation file, or `{}` when there is none yet. */
function readCensusFile() {
  try {
    const parsed = JSON.parse(fs.readFileSync(CENSUS_FILE, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Raise the floors / lower the ceilings for one spec. Called only from a
 * green run, so the numbers being written have already satisfied whatever
 * expectation was in force.
 */
function updateCensusFile(nnn, counts) {
  const record = ratchetFrom(counts);
  if (!record) return null;
  const all = readCensusFile();
  const before = JSON.stringify(all[nnn] ?? null);
  if (before === JSON.stringify(record)) return null;
  all[nnn] = record;
  const ordered = Object.fromEntries(Object.keys(all).sort().map((key) => [key, all[key]]));
  fs.writeFileSync(CENSUS_FILE, JSON.stringify(ordered, null, 2) + '\n');
  return record;
}

function writeReceipt(nnn, exitCode, counts, census, extra) {
  // Both halves must agree: the child's exit code and the census. Either
  // alone can mislead — a shell pipeline reports only the last stage's
  // status, and `# fail 0` can coexist with a killed fixture file.
  const passed = exitCode === 0 && census.ok;
  const receipt = {
    spec: nnn,
    commit: gitHead(),
    // What the receipt actually vouches for: the content of every production
    // source, not the commit id that happened to be checked out. A commit id
    // is blind to uncommitted edits; the content fingerprint is not.
    tree: productionFingerprint(ROOT),
    verdict: passed ? 'pass' : 'fail',
    timestamp: new Date().toISOString(),
    testsRun: counts ? counts.tests : null,
    testsPassed: counts ? counts.pass : null,
    census: counts ?? null,
    // The runtime that produced these counts: node v22 and v24 disagree
    // about whether a timed-out test takes its file's siblings with it, so
    // a count without its node version is a number without units.
    node: process.version,
    ...extra,
  };
  if (!passed && !census.ok) receipt.censusFailures = census.reasons;
  // A red under load is not evidence — recorded, never used to downgrade a
  // green (load cannot manufacture a pass; a cancelled test can, and the
  // census above is what catches that).
  if (!passed && loadIsSuspect(extra && extra.load)) {
    receipt.suspect = 'loaded';
  }
  fs.writeFileSync(RECEIPT_FILE, JSON.stringify(receipt, null, 2) + '\n');
  console.log(`[accept] census: ${formatCounts(counts)}`);
  if (!census.ok) {
    for (const reason of census.reasons) console.error(`[accept] CENSUS FAILURE: ${reason}`);
  }
  if (receipt.suspect === 'loaded') {
    console.error(
      `[accept] this red was produced under load ${extra.load.loadPeak} on ${extra.load.cpus} cores — ` +
        'it is not evidence; rerun on a quiet machine',
    );
  }
  console.log(`[accept] receipt written: ${RECEIPT_FILE} (${receipt.verdict})`);
  return receipt;
}

/** Booted/booting simulator udids right now — the cleanup baseline. */
function bootedSimulators() {
  try {
    const out = execFileSync('xcrun', ['simctl', 'list', 'devices', '-j'], { encoding: 'utf8' });
    const udids = new Set();
    for (const devices of Object.values(JSON.parse(out).devices)) {
      for (const device of devices) {
        if (device.state === 'Booted' || device.state === 'Booting') udids.add(device.udid);
      }
    }
    return udids;
  } catch {
    return null; // no listing → cleanup degrades to a no-op, never a run-breaker
  }
}

/**
 * Cools the simulators this run booted: everything booted at the end that
 * was not booted at the start. The baseline set is never touched — a
 * device the human (or a parallel run) booted is not ours to shut down. The
 * server itself cannot do this: to any single server life a predecessor's
 * boot is indistinguishable from the human's, while the runner brackets
 * every server life in the run and does know the provenance.
 */
function coolBootedDelta(before) {
  if (!before) return;
  const after = bootedSimulators();
  if (!after) return;
  const delta = [...after].filter((udid) => !before.has(udid));
  if (delta.length === 0) return;
  console.log(`[accept] cooling ${delta.length} simulator(s) this run booted: ${delta.join(', ')}`);
  for (const udid of delta) {
    try {
      execFileSync('xcrun', ['simctl', 'shutdown', udid], { stdio: 'ignore' });
    } catch {
      // Best-effort: a device mid-transition answers with an error; the next
      // run's baseline snapshot simply includes whatever state it lands in.
    }
  }
}

async function killServer(server) {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  await new Promise((resolve) => {
    server.once('exit', () => resolve());
    server.kill('SIGTERM');
    const hard = setTimeout(() => server.kill('SIGKILL'), 3000);
    hard.unref?.();
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const rebaseline = argv.includes('--rebaseline');
  const nnn = argv.find((arg) => !arg.startsWith('--'));
  // Before anything else: the counts this run is about to produce are only
  // comparable to the recorded ones on the runtime they were cut on.
  const runtime = assertSupportedNode('accept');
  const specFile = resolveSpec(nnn);
  const serverUrl = process.env.DETOX_SERVER_URL || 'ws://127.0.0.1:3456';
  const port = serverPortFrom(serverUrl);
  const host = serverHostFrom(serverUrl);
  // One token per acceptance run, minted here and handed to both sides.
  const token = randomBytes(16).toString('hex');

  // Exclusivity before the build: `yarn build` rewrites dist/server/cli.js,
  // which a concurrent parity run re-spawns per fixture file — the lane
  // covers dist/, not only the devices.
  const lane = await claimOrRefuse(`accept ${nnn}`);
  // Children this process must not outlive. Releasing the lane before they
  // are dead would drop exclusivity while work is still in flight, letting
  // the next run's sweep delete simulators out from under a live orphan.
  // The lane socket is the one thing the kernel would release anyway.
  const children = new Set();
  onFatalSignal(() => {
    for (const child of children) {
      try {
        child.kill('SIGKILL');
      } catch {
        /* already gone */
      }
    }
    lane.release();
  });
  // Under the lane, and only under it: this is `simctl delete`, and
  // `DETOX_LANE=off` means a concurrent run's live devices are in range.
  if (lane.held) {
    sweepProbeSimulators();
  } else {
    console.warn('[accept] lane not held — skipping the probe-simulator sweep (it deletes devices)');
  }
  const load = startLoadSampler();

  // A stale receipt must not outlive the run that invalidated it.
  fs.rmSync(RECEIPT_FILE, { force: true });

  build();

  // Snapshot before the first server life: the run cools its own boot delta
  // at the end, so consecutive runs do not strip-mine the cold fixture fleet.
  const bootedBefore = bootedSimulators();

  const server = spawnServer(port, host, token);
  children.add(server);
  const tapFile = path.join(os.tmpdir(), `detox-accept-${nnn}-${process.pid}.tap`);
  let exitCode = 1;
  let counts = null;
  let refusal = null;
  try {
    const why = await waitForServer(server, 10_000);
    console.log(`[accept] server readiness: ${why}`);
    // Without this check, a run whose own server had exited (port already
    // taken) could drive someone else's server with this run's token: every
    // test then fails on auth and reads as a product regression.
    //
    // Recorded as a refusal instead of calling `fail()`: `process.exit` does
    // not unwind `finally`, so exiting here would leave the server alive
    // holding the port and wedge every later run into the same refusal.
    if (why !== 'listening') {
      refusal = `server never became ready (${why}) — refusing to run the suite against an unknown server`;
    } else {
      const env = { ...process.env, DETOX_SERVER_URL: serverUrl, DETOX_SERVER_TOKEN: token };
      exitCode = await runTest(specFile, env, tapFile, (child) => children.add(child));
    }
  } finally {
    await killServer(server);
    coolBootedDelta(bootedBefore);
    counts = readCensus(tapFile);
    // Kept on a red verdict so the whole log is available for a post-mortem.
    if (exitCode === 0) fs.rmSync(tapFile, { force: true });
    else if (fs.existsSync(tapFile)) console.error(`[accept] TAP log kept for post-mortem: ${tapFile}`);
  }
  if (refusal) console.error(`[accept] ${refusal}`);

  // `--rebaseline` suspends the ratchet comparison for this run; it never
  // suspends redness, and it only writes from a green run.
  const expected = rebaseline ? null : readCensusFile()[nnn] ?? null;
  const census = verdict(counts, expected);
  if (expected) {
    console.log(
      `[accept] expected at least: ${expected.tests} tests / ${expected.pass} pass, at most ` +
        `${expected.skipped} skip / ${expected.todo} todo` +
        (expected.node ? ` (cut on node ${expected.node})` : ''),
    );
  }

  writeReceipt(nnn, exitCode, counts, census, {
    load: load.stop(),
    laneBypassed: lane.bypassed,
    nodeUnpinned: !runtime.pinned,
    expected,
    refusal,
  });
  // The census is half the verdict, so it must be able to fail the run.
  if (exitCode === 0 && !census.ok) exitCode = 1;

  if (exitCode === 0 && runtime.pinned) {
    const written = updateCensusFile(nnn, counts);
    if (written) {
      console.log(
        `[accept] census expectation for spec ${nnn} now ${written.tests} tests / ${written.pass} pass / ` +
          `${written.skipped} skip (node ${written.node})`,
      );
    }
  }

  console.log(`[accept] spec ${nnn} exit code: ${exitCode}`);
  process.exit(exitCode);
}

main().catch((err) => {
  console.error('[accept] runner error:', err);
  process.exit(1);
});
