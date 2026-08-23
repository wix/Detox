#!/usr/bin/env node
/**
 * The parity-harness runner: runs the Detox 20 e2e suite in place
 * (`detox/test/e2e`) as a real v21 project — `detox test -c ios.sim.release`
 * from `detox/test`, under Jest 30, through the shipped jest environment.
 * This dogfoods Detox's own migration story: the suite stays a Detox 20
 * suite and the v21 stack runs it.
 *
 *   yarn parity                               # every file in detox/test/e2e
 *   yarn parity e2e/01.sanity.test.js         # paths relative to detox/test
 *
 * Not the accept runner (parity plan, default 7): different cadence,
 * different granularity, no receipt — the parity burn-down is tracked
 * by a human reading this runner's output, not stamped by machinery.
 *
 * What this shell still owns (unchanged by the runner swap): the device
 * lane, the load sampler and its not-evidence stamp, the booted-delta
 * cooling, and the census ratchet — now computed from jest's own
 * `--json --outputFile` results instead of a TAP epilogue (a verdict is
 * computed, never read off a console).
 */
const { spawn, spawnSync, execFileSync } = require('node:child_process');
const { existsSync, readFileSync, writeFileSync, rmSync, mkdtempSync, readdirSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { verdict, formatCounts, ratchetFrom } = require('./lib/tap-census');
const { parseJestResults } = require('./lib/jest-census');
const {
  claimOrRefuse,
  sweepProbeSimulators,
  startLoadSampler,
  loadIsSuspect,
} = require('./lib/device-lane');
const { assertSupportedNode, nodeMajor } = require('./lib/runtime');

/** The booted-simulator set, or undefined when simctl itself is unwell. */
function bootedSimulators() {
  try {
    const out = execFileSync('xcrun', ['simctl', 'list', 'devices', '-j'], { encoding: 'utf8' });
    const parsed = JSON.parse(out);
    const booted = new Set();
    for (const devices of Object.values(parsed.devices)) {
      for (const device of devices) {
        if (device.state === 'Booted') booted.add(device.udid);
      }
    }
    return booted;
  } catch {
    return undefined;
  }
}

/**
 * Cools the simulators this run booted (the accept runner's own discipline,
 * `scripts/accept.js`): the run's dedicated server dies with its warm pool
 * still physically booted, and leftover boots starve later cold-pinned
 * fixtures. The baseline is never touched — a device the human booted is
 * not ours.
 */
function coolBootedDelta(before) {
  if (!before) return;
  const after = bootedSimulators();
  if (!after) return;
  const delta = [...after].filter((udid) => !before.has(udid));
  if (delta.length === 0) return;
  console.log(`[parity] cooling ${delta.length} simulator(s) this run booted: ${delta.join(', ')}`);
  for (const udid of delta) {
    try {
      execFileSync('xcrun', ['simctl', 'shutdown', udid], { stdio: 'ignore' });
    } catch {
      // Best-effort, like the accept runner: mid-transition devices object.
    }
  }
}

const repoRoot = path.resolve(__dirname, '..');
const corpusDir = path.join(repoRoot, 'detox', 'test');
const e2eDir = path.join(corpusDir, 'e2e');
const detoxCli = path.join(repoRoot, 'detox', 'dist', 'cli', 'detox.js');
if (!existsSync(detoxCli)) {
  console.error('parity: detox/dist/cli/detox.js is missing — run `yarn build` first.');
  process.exit(1);
}

// The example app is a suite precondition (like Xcode itself) — checked here
// so a missing build refuses instructively instead of failing every file
// with the same archive error.
const exampleApp =
  process.env.DETOX20_EXAMPLE_APP ??
  path.join(corpusDir, 'ios', 'build', 'Build', 'Products', 'Release-iphonesimulator', 'example.app');
if (!existsSync(exampleApp)) {
  console.error(
    `parity: the example app is not built at ${exampleApp} — run \`yarn build:ios\` in detox/test ` +
      '(or point DETOX20_EXAMPLE_APP at a build). A gate that silently skips is not a gate.',
  );
  process.exit(1);
}

const targets = process.argv.slice(2).filter((arg) => arg !== '--rebaseline');
/** Lowering the census is the only direction that hides bugs, so it is the
 *  only direction that needs a human to say so out loud. */
const rebaseline = process.argv.includes('--rebaseline');
const files =
  targets.length > 0
    ? targets
    : readdirSync(e2eDir)
        .filter((name) => name.endsWith('.test.js'))
        .sort()
        .map((name) => path.join('e2e', name));

const CENSUS_FILE = path.join(repoRoot, '.detox-parity-census.json');

/** The recorded expectation as written, with no judgement about it. */
function readCensusRaw() {
  try {
    return JSON.parse(readFileSync(CENSUS_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function readExpectedCensus() {
  try {
    const parsed = readCensusRaw();
    // An empty object is not an expectation: every key would be `undefined`,
    // the ratchet would skip every comparison, and the run would report a
    // pass it never earned — a truncated or merge-mangled census file is a
    // one-step silent reset. Treat it as absent, loudly.
    if (!parsed || typeof parsed !== 'object' || parsed.tests === undefined) {
      console.warn(`[parity] ${CENSUS_FILE} carries no test count — the ratchet is NOT in force this run`);
      return null;
    }
    return parsed;
  } catch {
    return null; // no expectation recorded yet — the first green run writes one
  }
}

/** The node major a recorded census was cut on, or null when it says nothing. */
function existingCensusMajor(expectation) {
  const version = expectation && expectation.node;
  if (!version) return null;
  const major = Number(String(version).replace(/^v/, '').split('.')[0]);
  return Number.isInteger(major) ? major : null;
}

/**
 * The run's dedicated Detox Server (with the injectable framework), spawned
 * once for the whole suite; one worker holds one session across every file
 * (one session per worker). Resolves with `{url, token, kill}`.
 */
function startParityServer() {
  const child = spawn(
    process.execPath,
    ['--import', 'tsx', path.join('specs', 'helpers', 'parity-server.ts')],
    { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const kill = () =>
    new Promise((resolve) => {
      if (child.exitCode !== null || child.signalCode !== null) return resolve();
      child.once('exit', () => {
        clearTimeout(hard);
        resolve();
      });
      child.kill('SIGTERM');
      const hard = setTimeout(() => child.kill('SIGKILL'), 5000);
      hard.unref();
    });
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };
    let buffer = '';
    const stderr = [];
    child.stderr.on('data', (chunk) => stderr.push(String(chunk)));
    child.stdout.on('data', (chunk) => {
      buffer += String(chunk);
      const lines = buffer.split('\n');
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed && parsed.type === 'parity-server') {
            return settle(resolve, { url: parsed.url, token: parsed.token, kill });
          }
        } catch {
          /* not our line */
        }
      }
    });
    child.once('exit', (code) => {
      settle(reject, new Error(`parity-server exited early (code ${String(code)})\n${stderr.join('')}`));
    });
    // A wedge detector, not a patience limit: the announce is
    // the observable counterpart (framework resolve + server spawn, seconds
    // on any healthy machine), so a silent minute means the helper is dead —
    // and a refusal must never leave the spawned server orphaned holding
    // simulators and a port.
    const timer = setTimeout(() => {
      void kill().then(() =>
        settle(reject, new Error('parity-server did not announce within 60s (killed)')),
      );
    }, 60_000);
    timer.unref();
  });
}

async function main() {
  assertSupportedNode('parity');
  // The two device suites never overlap. Taken before anything touches a
  // simulator or dist/.
  const lane = await claimOrRefuse('parity');
  // No signal handler here: the kernel releases the lane on any death anyway,
  // and installing a handler overrides node's default terminate action —
  // this runner then blocks the event loop in `spawnSync` for the whole run,
  // so the signal would be queued instead of delivered.
  if (lane.held) {
    sweepProbeSimulators();
  } else {
    console.warn('[parity] lane not held — skipping the probe-simulator sweep (it deletes devices)');
  }
  const load = startLoadSampler();

  const bootedBefore = bootedSimulators();
  const outDir = mkdtempSync(path.join(os.tmpdir(), 'detox-parity-jest-'));
  const jsonFile = path.join(outDir, 'jest-results.json');

  const server = await startParityServer();
  let result;
  try {
    result = spawnSync(
      process.execPath,
      [
        detoxCli,
        'test',
        '-c',
        'ios.sim.release',
        // Forwarded to jest verbatim (the CLI's pass-through contract):
        // machine-readable results to a file, human output untouched.
        '--json',
        `--outputFile=${jsonFile}`,
        ...targets,
      ],
      {
        cwd: corpusDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          PARITY_SERVER_URL: server.url,
          PARITY_SERVER_TOKEN: server.token,
          DETOX20_EXAMPLE_APP: exampleApp,
          // The example app is built with the new architecture; the suite's
          // arch-tagged tests (`@legacy` / `@new-arch`) key off this flag.
          RCT_NEW_ARCH_ENABLED: process.env.RCT_NEW_ARCH_ENABLED ?? '1',
          // `jest` is detox/test's own devDependency; the repo's bin dir
          // follows for anything the suite resolves from the root.
          PATH: [
            path.join(corpusDir, 'node_modules', '.bin'),
            path.join(repoRoot, 'node_modules', '.bin'),
            process.env.PATH ?? '',
          ].join(path.delimiter),
        },
      },
    );
  } finally {
    await server.kill();
  }
  coolBootedDelta(bootedBefore);

  let counts = null;
  try {
    counts = parseJestResults(readFileSync(jsonFile, 'utf8'));
  } catch {
    counts = null;
  }
  // `files` comes from the run when the run says (jest's own suite count),
  // not from a directory listing the run might not have honored (the
  // ratchet must assert what was measured). The enumeration is only the
  // fallback for a run that died before reporting.
  if (counts) counts.files = counts.suites > 0 ? counts.suites : files.length;

  // `--rebaseline` suspends the ratchet for this run — it does not suspend
  // redness: the census file is only updated from a green run, so a red run
  // can never lower the floor by accident.
  const expected = targets.length > 0 || rebaseline ? null : readExpectedCensus();
  const census = verdict(counts, expected);
  const childOk = (result.status ?? 1) === 0;
  const sampled = load.stop();

  console.log(`[parity] census: ${formatCounts(counts)} (node ${process.version})`);
  if (expected) {
    console.log(
      `[parity] expected at least: ${expected.tests} tests / ${expected.pass ?? '?'} pass across ` +
        `${expected.files} fixture files requested` +
        (expected.skipped === undefined ? '' : `, at most ${expected.skipped} skip`) +
        (expected.node ? ` (cut on node ${expected.node})` : ''),
    );
  }
  for (const reason of census.reasons) console.error(`[parity] CENSUS FAILURE: ${reason}`);

  // No receipt: nothing consumes one, and a receipt nobody reads is a future
  // lie. The human-read burn-down stays the checkpoint of record;
  // it just stops being the only thing that can notice.
  const ok = childOk && census.ok;
  if (!ok && loadIsSuspect(sampled)) {
    console.error(
      `[parity] this red was produced under load ${sampled.loadPeak} on ${sampled.cpus} cores — ` +
        'it is not evidence; rerun on a quiet machine',
    );
  }
  if (!ok) {
    console.error(`[parity] jest results kept for post-mortem: ${jsonFile}`);
  } else {
    rmSync(outDir, { recursive: true, force: true });
  }

  // The ratchet: raise on green, never lower by itself. A drop is what a test
  // that stopped registering looks like from outside, so lowering needs a
  // human who typed --rebaseline after reading the diff above.
  if (targets.length === 0 && ok && counts) {
    // `runner: 'jest'` distinguishes a re-seeded census from a restored one
    // (the jest migration re-measured to the identical numbers, and a marker
    // is what makes that machine-checkable).
    const next = { ...ratchetFrom(counts), files: counts.files, runner: 'jest' };
    const recorded = readCensusRaw();
    const recordedMajor = existingCensusMajor(recorded);
    // A stamp from another major is not an update, it is a change of units.
    if (recordedMajor !== null && recordedMajor !== nodeMajor() && !rebaseline) {
      console.warn(
        `[parity] NOT updating the census: it was cut on node major ${recordedMajor}, this is ` +
          `${nodeMajor()}. Re-cut it deliberately with \`yarn parity --rebaseline\`.`,
      );
    } else if (JSON.stringify(next) !== JSON.stringify(recorded)) {
      writeFileSync(CENSUS_FILE, JSON.stringify(next, null, 2) + '\n');
      console.log(
        `[parity] census expectation now ${next.tests} tests / ${next.pass} pass / ${next.skipped} skip ` +
          `across ${next.files} fixture files (node ${next.node})`,
      );
    }
  }
  console.log(`[parity] verdict: ${ok ? 'PASS' : 'FAIL'} (load ${sampled.loadAtStart} → peak ${sampled.loadPeak})`);
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error('[parity] runner error:', err);
  process.exit(1);
});
