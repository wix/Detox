'use strict';

/**
 * The device lane: exclusivity for the two device-bound
 * suites (`yarn accept`, `yarn parity`), held by a bound socket.
 *
 * Why a socket and not a lockfile: a file survives its owner. It would then
 * need staleness detection, which needs either a pid probe (pids are reused)
 * or a TTL — and a TTL is the wrong tool here, because the holder's death
 * is directly observable: the kernel closes its sockets on SIGKILL, panic
 * and power loss alike. A bound port cannot go stale, so there is nothing
 * to expire and nothing to unlink.
 *
 * Why refuse instead of wait: the same fail-fast shape the server uses for
 * a full pool. The caller knows what it wants to do with a busy machine; a
 * queue inside the runner is a queue behind a queue, and a run parked for
 * 20 minutes inside `yarn accept` is indistinguishable from a hang.
 *
 * Why this matters beyond convenience: every clock in these runners is
 * calibrated on "this machine is mine" — the parity cap, the accept cap,
 * `waitUntil`'s 30 s, the server's launch deadline. Under a second device
 * suite each one degrades from wedge detector into a patience limit against
 * a live-but-starved counterpart, which is exactly what these timeouts are
 * not meant to be. The lane is the precondition under which those timeouts
 * are valid, and it covers `dist/` too: `yarn accept` rebuilds the very
 * `dist/server/cli.js` that a parity run re-spawns per fixture file.
 *
 * Machine-scoped: two clones of this repo contend for one Mac's simulator
 * fleet, so the lane must not be repo-relative.
 */

const net = require('net');
const os = require('os');
const { execFileSync } = require('child_process');

const DEFAULT_PORT = 3457;
const HOST = '127.0.0.1';
/** A wedge detector on the banner read, never on the lease: a peer that binds
 *  and never answers is a death we cannot otherwise observe. Its only
 *  consequence is the quality of the refusal message. */
const BANNER_TIMEOUT_MS = 2000;

function lanePort() {
  const raw = process.env.DETOX_LANE_PORT;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

/** `DETOX_LANE=off` is the only bypass, and it is recorded — an undocumented
 *  bypass gets discovered anyway; a stamped one leaves evidence in the
 *  receipt. */
function laneDisabled() {
  return String(process.env.DETOX_LANE || '').toLowerCase() === 'off';
}

function humanAge(sinceMs) {
  // @issue DTX-8002: a missing `since` must not render as "started NaNs ago".
  if (!Number.isFinite(sinceMs)) return 'an unknown time';
  const seconds = Math.max(0, Math.round((Date.now() - sinceMs) / 1000));
  if (seconds < 90) return `${seconds}s`;
  return `${Math.round(seconds / 60)}m`;
}

/** Read the holder's one-line banner, or describe why we could not. */
function readBanner(port) {
  return new Promise((resolve) => {
    let data = '';
    const socket = net.connect({ host: HOST, port });
    const done = (value) => {
      socket.destroy();
      resolve(value);
    };
    const timer = setTimeout(() => done(null), BANNER_TIMEOUT_MS);
    timer.unref?.();
    socket.setEncoding('utf8');
    socket.on('data', (chunk) => {
      data += String(chunk);
      const line = data.split('\n')[0];
      if (data.includes('\n')) {
        clearTimeout(timer);
        try {
          done(JSON.parse(line));
        } catch {
          done(null);
        }
      }
    });
    socket.on('error', () => {
      clearTimeout(timer);
      done(null);
    });
    socket.on('end', () => {
      clearTimeout(timer);
      done(null);
    });
  });
}

/**
 * Take the lane or die. Resolves to a handle whose `release()` closes the
 * listener; the kernel does the same job on any death, so release() is a
 * courtesy for long-lived parents, never the guarantee.
 */
async function claimOrRefuse(what) {
  const port = lanePort();
  if (laneDisabled()) {
    console.warn(`[lane] DETOX_LANE=off — running WITHOUT exclusivity; this will be stamped in the receipt`);
    return { held: false, bypassed: true, port, release() {} };
  }
  const banner =
    JSON.stringify({
      what,
      pid: process.pid,
      since: Date.now(),
      cwd: process.cwd(),
      argv: process.argv.slice(2).join(' '),
    }) + '\n';

  const server = net.createServer((socket) => {
    socket.end(banner);
  });
  server.unref?.();

  const outcome = await new Promise((resolve) => {
    server.once('error', (err) => resolve(err));
    server.listen({ host: HOST, port, exclusive: true }, () => resolve(null));
  });

  if (outcome === null) {
    console.log(`[lane] held by ${what} (pid ${process.pid}) on ${HOST}:${port}`);
    return { held: true, bypassed: false, port, release: () => server.close() };
  }
  if (outcome.code !== 'EADDRINUSE') {
    console.error(`[lane] could not take the device lane: ${outcome.message}`);
    process.exit(3);
  }

  const holder = await readBanner(port);
  if (holder && holder.pid) {
    console.error(
      `[lane] REFUSED: the device lane is held by ${holder.what} ` +
        `(pid ${holder.pid}, started ${humanAge(holder.since)} ago, ${holder.cwd}).\n` +
        `[lane] Wait for it or kill it — this runner never queues. ` +
        `\`yarn lane\` prints the holder.`,
    );
  } else {
    console.error(
      `[lane] REFUSED: ${HOST}:${port} is held by something that does not speak the lane banner. ` +
        `Something is on the device lane and we cannot tell what it is doing.\n` +
        `[lane] Override the port with DETOX_LANE_PORT if it is a stranger.`,
    );
  }
  process.exit(3);
}

/**
 * Free / held / occupied-by-a-stranger, decided by connecting — never by
 * binding.
 *
 * @issue DTX-8001: binding to test the port turned `yarn lane`, a read-only
 * question, into a competitor for it.
 */
function probeLane(port) {
  return new Promise((resolve) => {
    let data = '';
    let connected = false;
    const socket = net.connect({ host: HOST, port });
    const done = (value) => {
      clearTimeout(timer);
      socket.destroy();
      resolve(value);
    };
    // A peer that accepts and never speaks is the stranger case: nothing of
    // ours behaves that way, and the caller needs an answer either way.
    const timer = setTimeout(() => done(connected ? { state: 'stranger' } : { state: 'free' }), BANNER_TIMEOUT_MS);
    timer.unref?.();
    socket.setEncoding('utf8');
    socket.on('connect', () => {
      connected = true;
    });
    socket.on('data', (chunk) => {
      data += String(chunk);
      if (!data.includes('\n')) return;
      try {
        done({ state: 'held', holder: JSON.parse(data.split('\n')[0]) });
      } catch {
        done({ state: 'stranger' });
      }
    });
    socket.on('error', (err) => done(err.code === 'ECONNREFUSED' ? { state: 'free' } : { state: 'stranger' }));
    socket.on('end', () => done(connected ? { state: 'stranger' } : { state: 'free' }));
  });
}

/** Who holds the lane right now — the machine-checkable form of "is it quiet". */
async function describeHolder() {
  const probe = await probeLane(lanePort());
  if (probe.state === 'free') return null;
  if (probe.state === 'held') return probe.holder;
  return { what: 'unknown', pid: null };
}

/** Simulators whose names this project's runners mint (`detox-specNNN-*`). */
function listProbeSimulators() {
  try {
    const out = execFileSync('xcrun', ['simctl', 'list', 'devices', '-j'], { encoding: 'utf8' });
    const found = [];
    for (const devices of Object.values(JSON.parse(out).devices)) {
      for (const device of devices) {
        if (/^detox-spec\d{3}-/.test(String(device.name))) {
          found.push({ udid: device.udid, name: device.name, state: device.state });
        }
      }
    }
    return found;
  } catch {
    return [];
  }
}

/**
 * Reap at the start of a run, under the lane — not at the end of the last one.
 *
 * Cleanup that must survive SIGKILL cannot live in the dying process: both
 * runners put theirs in `finally` / `process.on('exit')`, and SIGTERM skips
 * both. That is how an interrupted run leaks a booted probe, and a leaked
 * booted probe can hand a later run's cold-fixture tests a warm device
 * (see `specs/helpers/simctl.ts`). Holding the lane is what makes the sweep
 * safe: nothing else of ours can be using them.
 */
function sweepProbeSimulators() {
  const stale = listProbeSimulators();
  if (stale.length === 0) return [];
  console.log(`[lane] sweeping ${stale.length} leftover probe simulator(s) from an earlier run:`);
  for (const device of stale) {
    console.log(`[lane]   ${device.name} (${device.udid}, ${device.state})`);
    try {
      if (device.state !== 'Shutdown') {
        execFileSync('xcrun', ['simctl', 'shutdown', device.udid], { stdio: 'ignore' });
      }
    } catch {
      /* mid-transition devices object; the delete below still tries */
    }
    try {
      execFileSync('xcrun', ['simctl', 'delete', device.udid], { stdio: 'ignore' });
    } catch {
      /* best-effort: a device the human is holding open stays */
    }
  }
  return stale.map((device) => device.name);
}

/**
 * Load is an instrument, never a gate. A start-of-run
 * threshold necessarily lags, most of the load that has produced false reds
 * here was foreign (other jobs on the machine, macOS storage management),
 * and a refusal to measure teaches bypassing. So: sample it, stamp it, and
 * let a red carry the note that it is not evidence.
 */
function startLoadSampler() {
  const cpus = os.cpus().length;
  const at = () => os.loadavg()[0];
  let peak = at();
  const timer = setInterval(() => {
    peak = Math.max(peak, at());
  }, 5000);
  timer.unref?.();
  const start = at();
  return {
    stop() {
      clearInterval(timer);
      const round = (n) => Math.round(n * 10) / 10;
      return { cpus, loadAtStart: round(start), loadPeak: round(Math.max(peak, at())) };
    },
  };
}

/**
 * True when a red verdict was probably the machine talking, not the code.
 *
 * Keyed on the load at start, never the peak: a clean accept 006 run on an
 * idle machine (`loadAtStart` 2.8, 14 cores) peaked at 172 — booting
 * simulators is what a device suite does. A peak-keyed rule would stamp
 * "produced under load" on every red this project sees. The question the
 * label answers is "was somebody else already using this machine", and only
 * the starting sample can answer it.
 */
function loadIsSuspect(load) {
  return Boolean(load && load.loadAtStart >= 2 * load.cpus);
}

/**
 * Run `cleanup` on a fatal signal and then die of that same signal, so the
 * exit status matches it. A courtesy, not the guarantee — the guarantee is
 * the next run's sweep.
 */
function onFatalSignal(cleanup) {
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.once(signal, () => {
      try {
        cleanup();
      } catch {
        /* never mask the signal */
      }
      process.kill(process.pid, signal);
    });
  }
}

module.exports = {
  claimOrRefuse,
  describeHolder,
  probeLane,
  humanAge,
  sweepProbeSimulators,
  listProbeSimulators,
  startLoadSampler,
  loadIsSuspect,
  onFatalSignal,
  lanePort,
};
