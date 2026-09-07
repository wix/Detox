/**
 * The jest census reader (spec 010's corpus migration) against the verdict
 * rule it feeds, including the jest analogues of the three shapes that have
 * lied to this project: a killed worker (runtime-error suite), a
 * testExecError file, and an empty run.
 *
 * Root-level `.test.mjs`: the subject is `scripts/`, not a package source
 * (see `tap-census.test.mjs`).
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseJestResults } = require('./scripts/lib/jest-census.js');
const { verdict } = require('./scripts/lib/tap-census.js');

/** A jest --json aggregate with this corpus's counters. */
const jestJson = (over = {}) =>
  JSON.stringify({
    numTotalTestSuites: 23,
    numTotalTests: 258,
    numPassedTests: 214,
    numFailedTests: 0,
    numPendingTests: 44,
    numTodoTests: 0,
    numRuntimeErrorTestSuites: 0,
    wasInterrupted: false,
    success: true,
    ...over,
  });

describe('parseJestResults', () => {
  it('maps the aggregate onto the tap-census counters', () => {
    expect(parseJestResults(jestJson())).toEqual({
      tests: 258,
      suites: 23,
      pass: 214,
      fail: 0,
      cancelled: 0,
      skipped: 44,
      todo: 0,
      notOk: 0,
    });
  });

  it('a green mapped census satisfies the verdict rule', () => {
    expect(verdict(parseJestResults(jestJson()))).toEqual({ ok: true, reasons: [] });
  });

  it('has NO census for malformed or non-jest JSON', () => {
    expect(parseJestResults('{ not json')).toBeNull();
    expect(parseJestResults('"a string"')).toBeNull();
    expect(parseJestResults(JSON.stringify({ hello: 1 }))).toBeNull();
  });

  it('an INTERRUPTED run has no census — never a pass', () => {
    expect(parseJestResults(jestJson({ wasInterrupted: true }))).toBeNull();
    expect(verdict(null).ok).toBe(false);
  });

  /**
   * @issue DTX-8100
   * A killed-worker / testExecError file (jest's runtime-error suite) never
   * registers its leaf tests, so every leaf counter reads green and only
   * the suite-level error says otherwise. `notOk` folds in
   * `numRuntimeErrorTestSuites` so that mismatch stays visible even when an
   * ordinary failing test elsewhere would otherwise make a bare suite count
   * equal the leaf accounting.
   */
  it('a KILLED WORKER / testExecError file is a runtime-error suite → red outside leaf counters', () => {
    const counts = parseJestResults(
      jestJson({ numRuntimeErrorTestSuites: 1, numTotalTests: 235, numPassedTests: 191, success: false }),
    );
    const { ok, reasons } = verdict(counts);
    expect(ok).toBe(false);
    expect(reasons.join('\n')).toContain('outside the leaf counters');
  });

  it('a dead suite is NOT masked by a leaf failure elsewhere in the run', () => {
    const counts = parseJestResults(
      jestJson({
        numRuntimeErrorTestSuites: 1,
        numTotalTests: 236,
        numPassedTests: 191,
        numFailedTests: 1,
        success: false,
      }),
    );
    const { ok, reasons } = verdict(counts);
    expect(ok).toBe(false);
    expect(reasons.join('\n')).toContain('outside the leaf counters');
  });

  it('an EMPTY run is red', () => {
    const counts = parseJestResults(
      jestJson({ numTotalTests: 0, numPassedTests: 0, numPendingTests: 0 }),
    );
    expect(verdict(counts).ok).toBe(false);
  });

  it('a timed-out test is a visible FAILURE (jest has no cancelled bucket)', () => {
    const counts = parseJestResults(
      jestJson({ numFailedTests: 1, numPassedTests: 213, success: false }),
    );
    expect(counts.fail).toBe(1);
    expect(verdict(counts).ok).toBe(false);
  });

  it('the ratchet still catches a shrink and a skip-drift through the same verdict', () => {
    const expected = { tests: 258, pass: 214, skipped: 44, todo: 0, files: 23 };
    const shrunk = parseJestResults(jestJson({ numTotalTests: 242, numPassedTests: 198 }));
    expect(verdict(shrunk, expected).ok).toBe(false);
    const drifted = parseJestResults(
      jestJson({ numPassedTests: 106, numPendingTests: 152 }),
    );
    const { ok, reasons } = verdict(drifted, expected);
    expect(ok).toBe(false);
    expect(reasons.join('\n')).toContain('stopped running');
  });
});
