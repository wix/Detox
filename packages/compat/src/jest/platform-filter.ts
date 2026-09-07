/**
 * The `:platform:` name filter, in the shipped environment (spec 010 —
 * v20 shipped it, so does v21): a test or describe whose name opens with a
 * foreign platform tag registers as a skip — visible in the report, never a
 * silent drop, and never a run on the wrong platform.
 *
 * Port of v20 `DetoxPlatformFilterListener.js`, regex verbatim (`:5`):
 * anchored, and `[^:]+` — `foo :x: bar` (unanchored) runs, `:android: …`
 * skips on iOS, `:ios: …` runs, an untagged name runs. The mutation path is
 * v20's too: circus collects the block/test first, the filter stamps
 * `mode = 'skip'` on what was just collected.
 */

/** v20's own regex, verbatim. */
export const PLATFORM_REGEXP = /^:([^:]+):/;

export function foreignPlatformTag(name: string, platform: string): boolean {
  const match = PLATFORM_REGEXP.exec(name);
  return match !== null && match[1] !== platform;
}

/** The two circus shapes the filter touches — typed to what it reads, no more. */
interface SkippableNode {
  mode?: unknown;
}

interface CircusDescribeBlock extends SkippableNode {
  children: SkippableNode[];
}

interface CircusFilterState {
  currentDescribeBlock: CircusDescribeBlock;
}

interface CircusFilterEvent {
  name: string;
  blockName?: string;
  testName?: string;
}

/**
 * Handles `start_describe_definition` and `add_test`; every other event is
 * ignored. Both mutations are v20's own lines.
 */
export function applyPlatformFilter(
  event: CircusFilterEvent,
  state: CircusFilterState,
  platform: string,
): void {
  if (event.name === 'start_describe_definition') {
    if (typeof event.blockName === 'string' && foreignPlatformTag(event.blockName, platform)) {
      state.currentDescribeBlock.mode = 'skip';
    }
    return;
  }
  if (event.name === 'add_test') {
    if (typeof event.testName === 'string' && foreignPlatformTag(event.testName, platform)) {
      const children = state.currentDescribeBlock.children;
      const added = children[children.length - 1];
      if (added !== undefined) added.mode = 'skip';
    }
  }
}
