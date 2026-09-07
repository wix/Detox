'use strict';

/**
 * The census, read from jest's own machine-readable results (spec 010's
 * corpus migration; the census rules apply to any evidence, not to TAP
 * specifically).
 *
 * Counts come from `--json --outputFile=<path>`, mapped onto the same
 * counters `tap-census.js` reasons about, so `verdict`, `formatCounts` and
 * `ratchetFrom` are reused verbatim. `fail` includes a timed-out test (jest
 * has no `cancelled` bucket, so it stays 0 and `fail` carries the whole red
 * story).
 *
 * A run jest marks `wasInterrupted` has no census: "nothing was reported"
 * must never read as "nothing went wrong".
 */

/** The tap-census counters shape, from a jest --json results document. */
function parseJestResults(text) {
  let results;
  try {
    results = JSON.parse(String(text));
  } catch {
    return null;
  }
  if (typeof results !== 'object' || results === null) return null;
  if (typeof results.numTotalTests !== 'number') return null;
  if (results.wasInterrupted === true) return null;
  return {
    tests: results.numTotalTests,
    suites: typeof results.numTotalTestSuites === 'number' ? results.numTotalTestSuites : 0,
    pass: results.numPassedTests ?? 0,
    fail: results.numFailedTests ?? 0,
    cancelled: 0,
    skipped: results.numPendingTests ?? 0,
    todo: results.numTodoTests ?? 0,
    // @issue DTX-8100: a dead suite's leaf tests never registered, so leaf counters alone can't see it.
    notOk: (results.numFailedTests ?? 0) + (results.numRuntimeErrorTestSuites ?? 0),
  };
}

module.exports = { parseJestResults };
