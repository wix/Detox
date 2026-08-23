/**
 * The Detox element matchers for jest's own `expect` (spec 010): registered
 * via `expect.extend`, so one `expect` speaks both
 * vocabularies — `await expect(element(by.id('x'))).toBeVisible()` and
 * `expect(2 + 2).toBe(4)` in the same file, which v20's global shadowing
 * never allowed.
 *
 * Shape rules, each load-bearing:
 *  - `.not` is jest's inversion — a matcher reports its own `pass` and jest flips it.
 *    @issue DTX-4062: only a genuine expectation verdict (`DETOX_EXPECTATION_FAILED`) may
 *    become `pass: false`.
 *    @issue DTX-4067: any other failure (server gone, app dead, aborted) rethrows.
 *  - @issue DTX-4063: a failing matcher's message carries the typed Detox failure, code name
 *    included (accept test 6 greps `DETOX_[A-Z_]+`).
 *  - A non-element receiver is an instructive matcher failure naming the expected receiver —
 *    never a bare TypeError from a property read.
 */
import { DetoxErrorCode, type AppExpectation } from 'detox/internals';

import { expect as expectElement } from '../index';
import { detoxCodeName } from './taxonomy';

/** The compat stand-in's unwrap door — `Symbol.for`, shared across module copies. */
const RESOLVE_ELEMENT = Symbol.for('detox-compat.resolveElement');

interface MatcherResult {
  pass: boolean;
  message: () => string;
}

type DetoxJestMatcher = (received: unknown, ...args: unknown[]) => Promise<MatcherResult>;

function isDetoxElement(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<PropertyKey, unknown>;
  // The compat `element()` stand-in answers the resolve symbol; a raw client element (built
  // on an app handle outside the compat surface) duck-types.
  return (
    typeof candidate[RESOLVE_ELEMENT] === 'function' ||
    (typeof candidate.tap === 'function' && typeof candidate.atIndex === 'function')
  );
}

/** What the failure formatter and verdict test read off an unknown error. */
interface ErrorLike {
  code?: unknown;
  message?: unknown;
}

/** The typed failure, code name first — what jest prints as the test's failure. */
function formatDetoxFailure(err: unknown): string {
  const { code, message } = (err ?? {}) as ErrorLike;
  const name = detoxCodeName(code);
  const text = typeof message === 'string' ? message : String(err);
  return name !== undefined && !text.includes(name) ? `${name}: ${text}` : text;
}

function isExpectationVerdict(err: unknown): boolean {
  return (err as { code?: unknown } | null)?.code === DetoxErrorCode.DETOX_EXPECTATION_FAILED;
}

function detoxMatcher(
  name: string,
  run: (expectation: AppExpectation, args: unknown[]) => Promise<void>,
): DetoxJestMatcher {
  return async function (received: unknown, ...args: unknown[]): Promise<MatcherResult> {
    if (!isDetoxElement(received)) {
      const type = received === null ? 'null' : typeof received;
      throw new Error(
        `.${name}() is a Detox element matcher — its receiver must be an element built by ` +
          `Detox (\`expect(element(by.id('…'))).${name}(…)\`), but it received ${type}. ` +
          'Plain-value assertions keep using jest\'s own matchers.',
      );
    }
    try {
      await run(expectElement(received as never), args);
      return {
        pass: true,
        message: () =>
          `expected the element NOT to satisfy .${name}(${args.map(printable).join(', ')}), but it does`,
      };
    } catch (err) {
      if (!isExpectationVerdict(err)) throw err;
      return { pass: false, message: () => formatDetoxFailure(err) };
    }
  };
}

const printable = (value: unknown): string => {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

/**
 * The full `AppExpectation` vocabulary as jest matchers: the nine positive
 * names the spec's runner contract enumerates, plus the negative twins the
 * same vocabulary carries (`toBeNotVisible`, `toNotExist`, …).
 * The twins are not sugar for jest's `.not` — they are v20 API a migrating suite calls
 * directly, and each is its own wire assertion. jest's `.not` additionally inverts any of
 * them.
 */
export const detoxMatchers: Record<string, DetoxJestMatcher> = {
  toBeVisible: detoxMatcher('toBeVisible', (expectation, [percent]) =>
    percent === undefined
      ? expectation.toBeVisible()
      : expectation.toBeVisible(percent as number),
  ),
  toExist: detoxMatcher('toExist', (expectation) => expectation.toExist()),
  toBeFocused: detoxMatcher('toBeFocused', (expectation) => expectation.toBeFocused()),
  toHaveText: detoxMatcher('toHaveText', (expectation, [text]) =>
    expectation.toHaveText(text as string),
  ),
  toHaveLabel: detoxMatcher('toHaveLabel', (expectation, [label]) =>
    expectation.toHaveLabel(label as string),
  ),
  toHaveId: detoxMatcher('toHaveId', (expectation, [id]) => expectation.toHaveId(id as string)),
  toHaveValue: detoxMatcher('toHaveValue', (expectation, [value]) =>
    expectation.toHaveValue(value as string),
  ),
  toHaveSliderPosition: detoxMatcher('toHaveSliderPosition', (expectation, [position, tolerance]) =>
    tolerance === undefined
      ? expectation.toHaveSliderPosition(position as number)
      : expectation.toHaveSliderPosition(position as number, tolerance as number),
  ),
  toHaveToggleValue: detoxMatcher('toHaveToggleValue', (expectation, [value]) =>
    expectation.toHaveToggleValue(value as boolean),
  ),
  // The negative twins — v20's own spellings.
  toBeNotVisible: detoxMatcher('toBeNotVisible', (expectation) => expectation.toBeNotVisible()),
  toBeNotFocused: detoxMatcher('toBeNotFocused', (expectation) => expectation.toBeNotFocused()),
  toNotExist: detoxMatcher('toNotExist', (expectation) => expectation.toNotExist()),
  toNotHaveText: detoxMatcher('toNotHaveText', (expectation, [text]) =>
    expectation.toNotHaveText(text as string),
  ),
  toNotHaveLabel: detoxMatcher('toNotHaveLabel', (expectation, [label]) =>
    expectation.toNotHaveLabel(label as string),
  ),
  toNotHaveId: detoxMatcher('toNotHaveId', (expectation, [id]) =>
    expectation.toNotHaveId(id as string),
  ),
  toNotHaveValue: detoxMatcher('toNotHaveValue', (expectation, [value]) =>
    expectation.toNotHaveValue(value as string),
  ),
};
