'use strict';

/**
 * The census verdict.
 *
 * A green gate must assert a census, not an absence of red: "no failures"
 * and "every test passed" are different claims.
 *
 * Counter semantics this file relies on:
 *  - `# tests` counts leaf tests; `# suites` counts describes, separately.
 *  - `tests === pass + fail + cancelled + skipped + todo`, exactly.
 *  - a timed-out test lands in `# cancelled`, not in `# fail`.
 *  - a throwing `todo` test counts as todo, not fail — todo hides failures
 *    by design, which is why the ratchet counts todo as its own bucket
 *    rather than folding it into "fine".
 *
 * An expectation recorded alongside a census carries the node version that
 * produced it: node majors disagree on whether a timed-out test takes its
 * file's siblings with it, so the same corpus can honestly report two
 * different totals on two runtimes, and a ratchet may only compare
 * same-version counts.
 */

/** All seven epilogue counters, or `null` when the summary block is absent. */
function parseTap(text) {
  const count = (name) => {
    const m = String(text).match(new RegExp(`^# ${name} (\\d+)$`, 'm'));
    return m ? Number(m[1]) : null;
  };
  const tests = count('tests');
  // A run that died before printing its epilogue has no census: the one
  // shape where "nothing was reported" must not read as "nothing went
  // wrong".
  if (tests === null) return null;
  // @issue DTX-8103: top-level `not ok` points only — node indents nested subtests.
  const notOk = (String(text).match(/^not ok\b/gm) ?? []).length;
  return {
    tests,
    suites: count('suites') ?? 0,
    pass: count('pass') ?? 0,
    fail: count('fail') ?? 0,
    cancelled: count('cancelled') ?? 0,
    skipped: count('skipped') ?? 0,
    todo: count('todo') ?? 0,
    notOk,
  };
}

// @issue DTX-8101: floors (tests/files/pass) rise-only; ceilings (skipped/todo) fall-only.
const RATCHET_FLOORS = ['tests', 'files', 'pass'];
const RATCHET_CEILINGS = ['skipped', 'todo'];

/**
 * The verdict rule. `expected` is optional — when given, it is the
 * committed high-water mark this run must not fall below (the ratchet).
 * Returns `{ ok, reasons }`; `reasons` is empty iff `ok`.
 */
function verdict(counts, expected) {
  const reasons = [];
  if (!counts) {
    return { ok: false, reasons: ['no TAP summary block — the run died before reporting a census'] };
  }
  if (counts.tests === 0) reasons.push('zero tests ran');
  if (counts.fail > 0) reasons.push(`${counts.fail} failed`);
  // Cancelled is the timeout/parent-death bucket, and it is what `# fail 0`
  // hides.
  if (counts.cancelled > 0) reasons.push(`${counts.cancelled} cancelled (timed out, or died with their parent)`);
  const accounted = counts.pass + counts.fail + counts.cancelled + counts.skipped + counts.todo;
  if (accounted !== counts.tests) {
    reasons.push(`census does not add up: ${counts.tests} tests but ${accounted} accounted for`);
  }
  // @issue DTX-8102: a `not ok` the leaf counters don't account for — the throwing-hook shape.
  const accountedRed = counts.fail + counts.cancelled;
  if (counts.notOk !== undefined && counts.notOk > accountedRed) {
    reasons.push(
      `${counts.notOk} \`not ok\` point(s) but only ${accountedRed} failed/cancelled tests — ` +
        'something failed outside the leaf counters (a throwing hook, or a whole file)',
    );
  }
  if (expected) {
    for (const key of RATCHET_FLOORS) {
      if (expected[key] === undefined || counts[key] === undefined) continue;
      if (counts[key] < expected[key]) {
        const why =
          key === 'pass'
            ? 'tests that used to PASS no longer do, and nothing else in the run says so'
            : 'tests that used to exist did not run';
        reasons.push(`${key} fell ${expected[key]} → ${counts[key]} — ${why}`);
      }
    }
    for (const key of RATCHET_CEILINGS) {
      if (expected[key] === undefined || counts[key] === undefined) continue;
      if (counts[key] > expected[key]) {
        reasons.push(
          `${key} rose ${expected[key]} → ${counts[key]} — tests that used to RUN stopped running ` +
            '(a drifted name filter looks exactly like this, and the total does not move)',
        );
      }
    }
  }
  return { ok: reasons.length === 0, reasons };
}

/**
 * One authoritative line, printed instead of leaving counters to the eye.
 * Every counter the verdict rule reads appears here unconditionally —
 * including the zeros: a line that hides `0 todo` is a line whose reader
 * cannot tell "none" from "not measured".
 */
function formatCounts(counts) {
  if (!counts) return 'no census';
  const parts = [
    `${counts.tests} tests`,
    `${counts.pass} pass`,
    `${counts.fail} fail`,
    `${counts.cancelled} cancelled`,
    `${counts.skipped} skip`,
    `${counts.todo ?? 0} todo`,
  ];
  if (counts.notOk) parts.push(`${counts.notOk} not-ok`);
  if (counts.files !== undefined) parts.push(`${counts.files} files`);
  return parts.join(' / ');
}

/**
 * The record a green run may leave behind as the next run's expectation:
 * every counter the ratchet compares, plus the runtime that cut it (a count
 * without its node version is a number without units).
 */
function ratchetFrom(counts) {
  if (!counts) return null;
  const record = {
    tests: counts.tests,
    pass: counts.pass,
    skipped: counts.skipped,
    todo: counts.todo,
    node: process.version,
  };
  if (counts.files !== undefined) record.files = counts.files;
  return record;
}

module.exports = { parseTap, verdict, formatCounts, ratchetFrom };
