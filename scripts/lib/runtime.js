'use strict';

/**
 * The runtime pin, enforced rather than declared.
 *
 * `.nvmrc` is advisory, and yarn Berry does not enforce a root `engines`
 * field: `yarn lane` has run clean under node v22.23.0 in this repo while
 * `engines` said `>=24`. That matters because this project's numbers are
 * runtime-dependent in two measured ways:
 *
 *  - when a test times out, v22 takes the rest of its file with it (the
 *    siblings never register, so `# tests` silently shrinks) and v24 does
 *    not — the whole reason a census carries the node version that cut it;
 *  - a describe whose `before` throws prints `not ok` with `# fail 0`, and
 *    the process exit code is 1 on v24.x and 0 on v25.0.0 / v25.2.1
 *    (measured across eight installed runtimes). `>=24` admits v25, i.e.
 *    the floor was aimed one major behind the hazard.
 *
 * So the pin is an exact major, not a floor, and it refuses instead of
 * warning. The escape hatch exists (a machine may have nothing else), but it
 * is not free: an unpinned run is stamped as such in the receipt
 * (`nodeUnpinned: true`), and its counts never update the census
 * expectations.
 */

const SUPPORTED_MAJORS = [24];

function nodeMajor() {
  return Number(String(process.versions.node).split('.')[0]);
}

/**
 * Returns `{ pinned }`. Exits 4 on an unsupported runtime unless
 * `DETOX_NODE_ANY=1` was set, in which case the caller must carry `pinned:
 * false` into whatever it stamps.
 */
function assertSupportedNode(who) {
  if (SUPPORTED_MAJORS.includes(nodeMajor())) return { pinned: true };
  const wanted = SUPPORTED_MAJORS.map((major) => `v${major}.x`).join(' or ');
  if (String(process.env.DETOX_NODE_ANY || '') === '1') {
    console.warn(
      `[${who}] DETOX_NODE_ANY=1 — running on ${process.version}, not ${wanted}. ` +
        'The counts this run produces are in different units than the recorded ones; ' +
        'the receipt it writes is marked unpinned and will not update the census.',
    );
    return { pinned: false };
  }
  console.error(
    `[${who}] REFUSED: this runner is pinned to node ${wanted}, and this is ${process.version}.\n` +
      `[${who}] The pin matters: a timed-out test takes its file's siblings with it on v22, ` +
      'and a throwing hook exits 0 on v25 — the same corpus reports different numbers, and one of ' +
      'those numbers is silently wrong.\n' +
      `[${who}] Run \`nvm use\` (.nvmrc says 24), or set DETOX_NODE_ANY=1 to proceed with a receipt ` +
      'marked unpinned.',
  );
  process.exit(4);
}

module.exports = { assertSupportedNode, nodeMajor, SUPPORTED_MAJORS };
