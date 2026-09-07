/**
 * The `:platform:` filter, v20's anchored regex verbatim
 * (`DetoxPlatformFilterListener.js:5`) — the two directions the parity
 * preload's port already measured, plus the circus-state mutations.
 */
import { describe, expect, it } from 'vitest';

import { applyPlatformFilter, foreignPlatformTag, PLATFORM_REGEXP } from '../platform-filter';

describe('the regex, v20-parity in both directions', () => {
  it('is v20 own source', () => {
    expect(PLATFORM_REGEXP.source).toBe('^:([^:]+):');
  });

  it.each([
    [':android: taps a button', true],
    [':ios: taps a button', false],
    ['taps a button', false],
    // Unanchored tag — v20 runs it; the looser pre-port regex skipped it.
    ['foo :x: bar', false],
    // Case matters to v20; `:Android:` is a foreign tag (not `ios`), skipped.
    [':Android: taps', true],
  ])('%s → foreign=%s on an iOS run', (name, foreign) => {
    expect(foreignPlatformTag(name, 'ios')).toBe(foreign);
  });
});

interface FakeNode {
  mode?: unknown;
}

interface FakeDescribeBlock extends FakeNode {
  children: FakeNode[];
}

interface FakeCircusState {
  currentDescribeBlock: FakeDescribeBlock;
}

const state = (): FakeCircusState => ({
  currentDescribeBlock: { children: [{}, {}] },
});

describe('applyPlatformFilter — the circus mutations, v20 lines', () => {
  it('skips a foreign-tagged describe block', () => {
    const s = state();
    applyPlatformFilter(
      { name: 'start_describe_definition', blockName: ':android: block' },
      s,
      'ios',
    );
    expect(s.currentDescribeBlock.mode).toBe('skip');
  });

  it('leaves an own-platform describe alone', () => {
    const s = state();
    applyPlatformFilter({ name: 'start_describe_definition', blockName: ':ios: block' }, s, 'ios');
    expect(s.currentDescribeBlock.mode).toBeUndefined();
  });

  it('skips the JUST-ADDED test on add_test, not its siblings', () => {
    const s = state();
    applyPlatformFilter({ name: 'add_test', testName: ':android: should skip' }, s, 'ios');
    expect(s.currentDescribeBlock.children[1].mode).toBe('skip');
    expect(s.currentDescribeBlock.children[0].mode).toBeUndefined();
  });

  it('runs an untagged and an unanchored-tag test', () => {
    const s = state();
    applyPlatformFilter({ name: 'add_test', testName: 'plain test' }, s, 'ios');
    applyPlatformFilter({ name: 'add_test', testName: 'foo :x: bar' }, s, 'ios');
    expect(s.currentDescribeBlock.children.every((child) => child.mode === undefined)).toBe(true);
  });

  it('ignores every other event', () => {
    const s = state();
    applyPlatformFilter({ name: 'test_fn_start', testName: ':android: x' }, s, 'ios');
    expect(s.currentDescribeBlock.mode).toBeUndefined();
    expect(s.currentDescribeBlock.children.every((child) => child.mode === undefined)).toBe(true);
  });
});
