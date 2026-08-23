/**
 * The census verdict rule, pinned against real node:test
 * epilogues — including the three shapes that have lied to this project.
 *
 * Root-level `.test.mjs`: the subject is `scripts/`, not a package source
 * (the vitest config includes only package sources and root-level
 * `*.test.mjs`; see `eslint-rules.test.mjs` for the same pattern).
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseTap, verdict, formatCounts, ratchetFrom } = require('./scripts/lib/tap-census.js');

/** A node:test epilogue with the counters this project has actually seen. */
const epilogue = (counts) =>
  [
    '# tests ' + counts.tests,
    '# suites ' + (counts.suites ?? 0),
    '# pass ' + counts.pass,
    '# fail ' + (counts.fail ?? 0),
    '# cancelled ' + (counts.cancelled ?? 0),
    '# skipped ' + (counts.skipped ?? 0),
    '# todo ' + (counts.todo ?? 0),
    '# duration_ms 1234.5',
  ].join('\n');

describe('parseTap', () => {
  it('reads all seven counters', () => {
    const counts = parseTap(epilogue({ tests: 4, suites: 1, pass: 1, skipped: 1, todo: 2 }));
    expect(counts).toEqual({
      tests: 4,
      suites: 1,
      pass: 1,
      fail: 0,
      cancelled: 0,
      skipped: 1,
      todo: 2,
      notOk: 0,
    });
  });

  /**
   * @issue DTX-8103
   * Node indents nested subtests, so an anchored (`^`) match sees only the
   * outermost `not ok` points — exactly where a failing suite, or a whole
   * file killed at its cap, reports while `# fail` stays 0.
   */
  it('counts top-level `not ok` points and ignores nested ones', () => {
    const tap = ['not ok 1 - suite with a broken beforeAll', '    not ok 1 - inner', 'ok 2 - fine'].join('\n');
    expect(parseTap(tap + '\n' + epilogue({ tests: 2, pass: 1, skipped: 1 })).notOk).toBe(1);
  });

  it('returns null when the summary block is missing entirely', () => {
    // SIGINT to the runner exits non-zero with no epilogue at all.
    expect(parseTap('ok 1 - a\nok 2 - b\n')).toBeNull();
  });
});

describe('verdict', () => {
  it('passes a clean run', () => {
    const counts = parseTap(epilogue({ tests: 8, pass: 8 }));
    expect(verdict(counts)).toEqual({ ok: true, reasons: [] });
  });

  it('passes a run whose non-passes are all skips (the parity corpus shape)', () => {
    const counts = parseTap(epilogue({ tests: 212, pass: 169, skipped: 43 }));
    expect(verdict(counts).ok).toBe(true);
  });

  it('FAILS the real incident: cancelled tests beside "# fail 0"', () => {
    // A fixture file killed at the runner's cap: `# fail` stays 0, but the
    // run left cancelled tests behind.
    const counts = parseTap(epilogue({ tests: 212, pass: 157, cancelled: 12, skipped: 43 }));
    const result = verdict(counts);
    expect(result.ok).toBe(false);
    expect(result.reasons.join(' ')).toMatch(/12 cancelled/);
  });

  it('FAILS a run that reported no census at all', () => {
    expect(verdict(null).ok).toBe(false);
  });

  it('FAILS a run where nothing ran', () => {
    expect(verdict(parseTap(epilogue({ tests: 0, pass: 0 }))).ok).toBe(false);
  });

  it('FAILS a census that does not add up', () => {
    // The counters must account for every test; anything else means a test
    // reached no verdict at all.
    const result = verdict({ tests: 10, suites: 0, pass: 7, fail: 0, cancelled: 0, skipped: 0, todo: 0 });
    expect(result.ok).toBe(false);
    expect(result.reasons.join(' ')).toMatch(/does not add up/);
  });

  it('FAILS a shrunken corpus — the never-registered family', () => {
    // Tests can stop registering without anything inside the run seeing it;
    // only an expectation that outlives the run catches the shrink.
    const counts = { ...parseTap(epilogue({ tests: 196, pass: 196 })), files: 23 };
    const result = verdict(counts, { tests: 212, files: 23 });
    expect(result.ok).toBe(false);
    expect(result.reasons.join(' ')).toMatch(/tests fell 212 → 196/);
  });

  it('passes a GROWN corpus — growth is the normal state of a port', () => {
    const counts = { ...parseTap(epilogue({ tests: 240, pass: 197, skipped: 43 })), files: 25 };
    expect(verdict(counts, { tests: 212, files: 23 }).ok).toBe(true);
  });

  it('FAILS a lost fixture file even when the tests that remain all pass', () => {
    const counts = { ...parseTap(epilogue({ tests: 212, pass: 169, skipped: 43 })), files: 22 };
    expect(verdict(counts, { tests: 212, files: 23 }).reasons.join(' ')).toMatch(/files fell 23 → 22/);
  });

  /**
   * @issue DTX-8101
   * The ratchet has two directions: `tests`/`files`/`pass` may only rise (a
   * corpus grows); `skipped`/`todo` may only fall (tests leaving the
   * running set). Guarding the total alone misses the dominant regression
   * shape: a corpus that stays registered while it stops running — tests
   * turn into skips, `# tests` never moves, and a total-only ratchet reads
   * green.
   */
  it('FAILS a corpus that stopped RUNNING while staying registered', () => {
    const counts = { ...parseTap(epilogue({ tests: 258, pass: 106, skipped: 152 })), files: 23 };
    const result = verdict(counts, { tests: 258, files: 23, pass: 214, skipped: 44 });
    expect(result.ok).toBe(false);
    expect(result.reasons.join(' ')).toMatch(/pass fell 214 → 106/);
    expect(result.reasons.join(' ')).toMatch(/skipped rose 44 → 152/);
  });

  it('FAILS a receipt-shaped run where nothing failed because nothing ran', () => {
    // The accept-side twin: `verdict: pass` with `testsPassed: 0`.
    const counts = parseTap(epilogue({ tests: 8, pass: 0, skipped: 8 }));
    expect(verdict(counts, { tests: 8, pass: 8, skipped: 0 }).ok).toBe(false);
  });

  /**
   * @issue DTX-8102
   * A describe whose `before` throws prints `not ok` at the suite level
   * while `# fail` stays 0: the suite is not a leaf, so it lands in neither
   * `tests` nor `fail`, and the pass/fail/cancelled/skipped/todo identity
   * still holds. The child process's exit code alone does not reliably
   * catch this (it differs by node major), so this file reads `not ok`
   * from the TAP body directly instead.
   */
  it('FAILS a throwing hook: a `not ok` the leaf counters do not account for', () => {
    const tap = 'not ok 1 - suite with a broken beforeAll\n' + epilogue({ tests: 4, pass: 2, skipped: 2 });
    const result = verdict(parseTap(tap));
    expect(result.ok).toBe(false);
    expect(result.reasons.join(' ')).toMatch(/outside the leaf counters/);
  });

  it('does not cry `not ok` when the failures are already counted', () => {
    const tap = 'not ok 1 - a real failing test\n' + epilogue({ tests: 2, pass: 1, fail: 1 });
    expect(verdict(parseTap(tap)).reasons.join(' ')).not.toMatch(/outside the leaf counters/);
  });

  it('passes a run that skips FEWER than recorded — the ceiling only bites upward', () => {
    const counts = parseTap(epilogue({ tests: 258, pass: 220, skipped: 38 }));
    expect(verdict(counts, { tests: 258, pass: 214, skipped: 44 }).ok).toBe(true);
  });
});

describe('ratchetFrom', () => {
  it('records every counter the ratchet compares, with the runtime that cut it', () => {
    const counts = { ...parseTap(epilogue({ tests: 258, pass: 214, skipped: 44 })), files: 23 };
    expect(ratchetFrom(counts)).toEqual({
      tests: 258,
      pass: 214,
      skipped: 44,
      todo: 0,
      files: 23,
      node: process.version,
    });
  });

  it('has nothing to record when the run reported no census', () => {
    expect(ratchetFrom(null)).toBeNull();
  });
});

describe('formatCounts', () => {
  it('prints one authoritative line instead of leaving counters to the eye', () => {
    const counts = { ...parseTap(epilogue({ tests: 212, pass: 168, cancelled: 1, skipped: 43 })), files: 23 };
    expect(formatCounts(counts)).toBe('212 tests / 168 pass / 0 fail / 1 cancelled / 43 skip / 0 todo / 23 files');
  });

  it('prints the zeros too — "none" and "not measured" must not look alike', () => {
    expect(formatCounts(parseTap(epilogue({ tests: 1, pass: 1 })))).toBe(
      '1 tests / 1 pass / 0 fail / 0 cancelled / 0 skip / 0 todo',
    );
  });

  it('says so plainly when there is no census', () => {
    expect(formatCounts(null)).toBe('no census');
  });
});
