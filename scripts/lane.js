#!/usr/bin/env node
'use strict';

/**
 * yarn lane            : who holds the device lane right now
 * yarn lane --sweep    : delete leftover `detox-specNNN-*` probe simulators
 *
 * The machine-checkable form of "make sure the machine is quiet first":
 * "quiet" is a claim about the machine, not about your own process list,
 * so this prints the machine's answer.
 */

const { describeHolder, listProbeSimulators, sweepProbeSimulators, lanePort } = require('./lib/device-lane');

async function main() {
  const sweep = process.argv.includes('--sweep');
  const holder = await describeHolder();

  if (holder) {
    const age = holder.since ? `${Math.round((Date.now() - holder.since) / 1000)}s ago` : 'unknown start';
    console.log(`held: ${holder.what} (pid ${holder.pid ?? '?'}, started ${age})`);
    if (holder.cwd) console.log(`      ${holder.cwd}${holder.argv ? ` — ${holder.argv}` : ''}`);
  } else {
    console.log(`free (port ${lanePort()})`);
  }

  const probes = listProbeSimulators();
  if (probes.length > 0) {
    console.log(`probe simulators left over: ${probes.length}`);
    for (const device of probes) console.log(`      ${device.name} (${device.state})`);
  }

  if (!sweep) {
    process.exit(holder ? 3 : 0);
  }
  // Sweeping while someone holds the lane would delete devices out from under
  // a live run — the lane is what makes a sweep safe.
  if (holder) {
    console.error('refusing to sweep: the lane is held, and those simulators may be in use');
    process.exit(3);
  }
  sweepProbeSimulators();
  process.exit(0);
}

main().catch((err) => {
  console.error('[lane] error:', err);
  process.exit(1);
});
