/**
 * The `expect.extend` matcher set (spec 010's integration-gated contract):
 * all nine registered; async pass/fail; only a genuine expectation VERDICT
 * becomes `pass: false` (anything else rethrows, or `.not` would turn a dead
 * app green); a non-element receiver is an instructive failure; the failure
 * message carries the typed code name.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DetoxError, DetoxErrorCode } from 'detox/client';

import { detoxMatchers } from '../matchers';

const expectation = {
  toBeVisible: vi.fn(async () => undefined),
  toBeNotVisible: vi.fn(async () => undefined),
  toBeNotFocused: vi.fn(async () => undefined),
  toNotExist: vi.fn(async () => undefined),
  toNotHaveText: vi.fn(async () => undefined),
  toNotHaveLabel: vi.fn(async () => undefined),
  toNotHaveId: vi.fn(async () => undefined),
  toNotHaveValue: vi.fn(async () => undefined),
  toExist: vi.fn(async () => undefined),
  toBeFocused: vi.fn(async () => undefined),
  toHaveText: vi.fn(async () => undefined),
  toHaveLabel: vi.fn(async () => undefined),
  toHaveId: vi.fn(async () => undefined),
  toHaveValue: vi.fn(async () => undefined),
  toHaveSliderPosition: vi.fn(async () => undefined),
  toHaveToggleValue: vi.fn(async () => undefined),
};

// The compat surface is mocked at the module seam the matchers import: the
// matcher unit under test is the jest-facing shape, not the wire (that half
// lives in the compat integration suite).
vi.mock('../../index', () => ({
  expect: () => expectation,
}));

/** A stand-in element: answers the cross-copy resolve symbol like the real proxy. */
const element = { [Symbol.for('detox-compat.resolveElement')]: () => ({}) };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('registration surface', () => {
  it('exposes the nine positive names of the runner contract plus the seven negative twins', () => {
    expect(Object.keys(detoxMatchers).sort()).toEqual([
      'toBeFocused',
      'toBeNotFocused',
      'toBeNotVisible',
      'toBeVisible',
      'toExist',
      'toHaveId',
      'toHaveLabel',
      'toHaveSliderPosition',
      'toHaveText',
      'toHaveToggleValue',
      'toHaveValue',
      'toNotExist',
      'toNotHaveId',
      'toNotHaveLabel',
      'toNotHaveText',
      'toNotHaveValue',
    ]);
  });

  it('each negative twin drives its OWN wire assertion (never a .not rewrite)', async () => {
    await detoxMatchers.toBeNotVisible(element);
    expect(expectation.toBeNotVisible).toHaveBeenCalledWith();
    await detoxMatchers.toBeNotFocused(element);
    expect(expectation.toBeNotFocused).toHaveBeenCalledWith();
    await detoxMatchers.toNotExist(element);
    expect(expectation.toNotExist).toHaveBeenCalledWith();
    await detoxMatchers.toNotHaveText(element, 'gone');
    expect(expectation.toNotHaveText).toHaveBeenCalledWith('gone');
    await detoxMatchers.toNotHaveLabel(element, 'label');
    expect(expectation.toNotHaveLabel).toHaveBeenCalledWith('label');
    await detoxMatchers.toNotHaveId(element, 'id');
    expect(expectation.toNotHaveId).toHaveBeenCalledWith('id');
    await detoxMatchers.toNotHaveValue(element, 'value');
    expect(expectation.toNotHaveValue).toHaveBeenCalledWith('value');
  });
});

describe('the async pass/fail contract', () => {
  it('a satisfied expectation is pass: true, with a .not-ready message', async () => {
    const result = await detoxMatchers.toBeVisible(element);
    expect(result.pass).toBe(true);
    expect(result.message()).toContain('NOT');
    expect(expectation.toBeVisible).toHaveBeenCalledWith();
  });

  it('the .not message prints arguments, unstringifiable ones included', async () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const result = await detoxMatchers.toHaveText(element, circular);
    expect(result.pass).toBe(true);
    expect(result.message()).toContain('toHaveText');
  });

  it('forwards matcher arguments to the expectation', async () => {
    await detoxMatchers.toBeVisible(element, 50);
    expect(expectation.toBeVisible).toHaveBeenCalledWith(50);
    await detoxMatchers.toHaveText(element, 'Welcome');
    expect(expectation.toHaveText).toHaveBeenCalledWith('Welcome');
    await detoxMatchers.toHaveSliderPosition(element, 0.5, 0.1);
    expect(expectation.toHaveSliderPosition).toHaveBeenCalledWith(0.5, 0.1);
    await detoxMatchers.toHaveSliderPosition(element, 0.5);
    expect(expectation.toHaveSliderPosition).toHaveBeenLastCalledWith(0.5);
    await detoxMatchers.toHaveToggleValue(element, true);
    expect(expectation.toHaveToggleValue).toHaveBeenCalledWith(true);
    await detoxMatchers.toHaveLabel(element, 'label');
    await detoxMatchers.toHaveId(element, 'id');
    await detoxMatchers.toHaveValue(element, 'value');
    await detoxMatchers.toExist(element);
    await detoxMatchers.toBeFocused(element);
  });

  /**
   * @issue DTX-4062
   * Only a genuine expectation verdict (`DETOX_EXPECTATION_FAILED`) may become `pass: false`.
   * @issue DTX-4063
   * A failing matcher's message carries the typed Detox failure, code name included.
   */
  it('an expectation VERDICT is pass: false, message carrying the typed code name', async () => {
    expectation.toHaveText.mockRejectedValueOnce(
      new DetoxError('Test Failed: no text "Goodbye"', {
        code: DetoxErrorCode.DETOX_EXPECTATION_FAILED,
      }),
    );
    const result = await detoxMatchers.toHaveText(element, 'Goodbye');
    expect(result.pass).toBe(false);
    expect(result.message()).toContain('DETOX_EXPECTATION_FAILED');
    expect(result.message()).toContain('Test Failed: no text "Goodbye"');
  });

  /**
   * @issue DTX-4067
   * Any other failure (server gone, app dead, aborted) rethrows — `.not` must never turn a
   * dead app into a green test.
   */
  it('any OTHER failure rethrows — .not must never turn a dead app green', async () => {
    expectation.toBeVisible.mockRejectedValueOnce(
      new DetoxError('connection lost', { code: DetoxErrorCode.DETOX_CONNECTION_LOST }),
    );
    await expect(detoxMatchers.toBeVisible(element)).rejects.toThrowError('connection lost');
  });
});

describe('receiver discipline', () => {
  it('refuses a non-element receiver with an instructive message', async () => {
    await expect(detoxMatchers.toBeVisible(42)).rejects.toThrowError(
      /toBeVisible\(\) is a Detox element matcher.*received number/s,
    );
    await expect(detoxMatchers.toExist(null)).rejects.toThrowError(/received null/);
  });

  it('accepts a duck-typed raw client element (tap + atIndex)', async () => {
    const raw = { tap: () => undefined, atIndex: () => raw };
    const result = await detoxMatchers.toExist(raw);
    expect(result.pass).toBe(true);
  });
});
