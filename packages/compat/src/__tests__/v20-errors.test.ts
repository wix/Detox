/**
 * The v20 wording bridge and the two ports that carry v20 dialect facts:
 * `toV20Error`/`withV20Errors`, the launch-args editor, and the
 * URL-blacklist serializer. All three are pure — no transport, no simulator.
 */
import { describe, it, expect } from 'vitest';
import { DetoxError, DetoxErrorCode } from 'detox/client';

import { toV20Error, withV20Errors, NOT_CONNECTED_MESSAGE } from '../v20-errors';
import { LaunchArgsEditor } from '../launch-args';
import { serializeURLBlacklistForIOS } from '../url-blacklist';
import { DetoxConstants } from '../constants';

describe('v20 wording for app death', () => {
  /**
   * @issue DTX-4042
   * Nothing is invented: the code, the details and the cause ride through untouched, and the
   * native's own crash report is folded back into the message.
   * @issue DTX-4043
   * v20 put the native report in the stack too, because that is the only part jest prints for a
   * thrown error. No manual prepend is needed: V8 renders `stack` as `<name>: <message>` +
   * frames, so the report is there exactly once.
   */
  it('leads with v20’s sentence and folds the native report into message AND stack', () => {
    const original = new DetoxError('The app behind this handle is gone (socket closed)', {
      code: DetoxErrorCode.DETOX_APP_DIED,
      details: { appReport: { errorDetails: 'JS Exception: Simulating early crash' } },
    });
    const translated = toV20Error(original) as DetoxError;
    expect(translated.message).toContain('The app has crashed, see the details below:');
    expect(translated.message).toContain('JS Exception: Simulating early crash');
    expect(translated.stack).toContain('Simulating early crash');
    expect(translated.stack?.match(/Simulating early crash/g)).toHaveLength(1);
    expect(translated.code).toBe(DetoxErrorCode.DETOX_APP_DIED);
    expect(translated.details).toBe(original.details);
    expect(translated.cause).toBe(original);
  });

  it('falls back to the v21 message when the app sent no report', () => {
    const translated = toV20Error(
      new DetoxError('The app behind this handle is gone', {
        code: DetoxErrorCode.DETOX_APP_DIED,
      }),
    ) as DetoxError;
    expect(translated.message).toContain('The app has crashed');
    expect(translated.message).toContain('The app behind this handle is gone');
  });

  it('leaves every other error strictly alone', () => {
    const other = new DetoxError('nope', { code: DetoxErrorCode.DETOX_INVALID_ARGUMENT });
    expect(toV20Error(other)).toBe(other);
    const plain = new Error('plain');
    expect(toV20Error(plain)).toBe(plain);
  });

  it('is the wording device.launchApp()-less element traffic uses', () => {
    // The sentence itself is what ported suites match on.
    expect(NOT_CONNECTED_MESSAGE).toBe("Detox can't seem to connect to the test app(s)!");
  });
});

describe('withV20Errors', () => {
  class FakeElement {
    #calls = 0;
    atIndex(): this {
      this.#calls += 1;
      return this;
    }
    get calls(): number {
      return this.#calls;
    }
    async tap(): Promise<void> {
      await Promise.reject(
        new DetoxError('The app behind this handle is gone', {
          code: DetoxErrorCode.DETOX_APP_DIED,
        }),
      );
    }
    throwsSync(): never {
      throw new DetoxError('gone', { code: DetoxErrorCode.DETOX_APP_DIED });
    }
    async getAttributes(): Promise<{ elements: string[] }> {
      return { elements: ['a'] };
    }
    echo(value: unknown): unknown {
      return value;
    }
  }

  /**
   * @issue DTX-4045
   * Every rejection an element/expectation/waitFor object produces passes through
   * `toV20Error`, chained objects included.
   * @issue DTX-4047
   * The proxy's receiver is the raw object, so private-field access survives it: `atIndex`
   * returns the same instance, and the wrapper keeps working on it.
   */
  it('re-words rejections and synchronous throws, through chained objects', async () => {
    const wrapped = withV20Errors(new FakeElement());
    await expect(wrapped.tap()).rejects.toThrowError(/The app has crashed/);
    expect(() => wrapped.throwsSync()).toThrowError(/The app has crashed/);
    await expect(wrapped.atIndex().tap()).rejects.toThrowError(/The app has crashed/);
    expect(wrapped.calls).toBe(1);
  });

  it('passes arguments through untouched by default, and through the mapper when given', () => {
    const plain = withV20Errors(new FakeElement());
    expect(plain.echo('as-is')).toBe('as-is');
    const mapped = withV20Errors(new FakeElement(), (value) => `mapped:${String(value)}`);
    expect(mapped.echo('x')).toBe('mapped:x');
  });

  it('hands DATA back unwrapped — a result object is not a chained surface', async () => {
    const result = await withV20Errors(new FakeElement()).getAttributes();
    expect('elements' in result).toBe(true);
    expect(result).toEqual({ elements: ['a'] });
  });
});

describe('the launch-args editor (v20 LaunchArgsEditor)', () => {
  it('deep-merges shared under local without letting either alias the other', () => {
    const editor = new LaunchArgsEditor();
    editor.shared.modify({ nested: { a: 1, b: 2 }, only: 'shared' });
    editor.modify({ nested: { b: 3 } });
    expect(editor.get()).toEqual({ nested: { a: 1, b: 3 }, only: 'shared' });
    // The merge must not have written through into the shared scope.
    expect(editor.shared.get()).toEqual({ nested: { a: 1, b: 2 }, only: 'shared' });
  });

  it('clones ARRAY values instead of aliasing them (v20 `_.cloneDeep`)', () => {
    const editor = new LaunchArgsEditor();
    const patterns = ['a', 'b'];
    editor.modify({ detoxURLBlacklistRegex: patterns });
    const snapshot = editor.get().detoxURLBlacklistRegex as string[];
    expect(snapshot).toEqual(['a', 'b']);
    snapshot.push('c');
    expect(editor.get().detoxURLBlacklistRegex).toEqual(['a', 'b']);
  });

  /**
   * @issue DTX-4038
   * `get()`'s merge follows lodash's array behaviour, which merges index-wise rather than
   * replacing: `_.merge({a:[1,2,3]}, {a:[9]})` is `{a:[9,2,3]}`, and a port that replaced the
   * array would quietly change what reaches the app.
   */
  it('merges ARRAYS index-wise, as lodash does — a shorter local does not truncate', () => {
    const editor = new LaunchArgsEditor();
    editor.shared.modify({ tags: ['a', 'b', 'c'] });
    editor.modify({ tags: ['x'] });
    expect(editor.get().tags).toEqual(['x', 'b', 'c']);
  });

  it('clones RegExp values instead of sharing them (detoxURLBlacklistRegex is a RegExp)', () => {
    const editor = new LaunchArgsEditor();
    const pattern = /foo/i;
    editor.modify({ detoxURLBlacklistRegex: pattern });
    const snapshot = editor.get().detoxURLBlacklistRegex as RegExp;
    expect(snapshot).not.toBe(pattern);
    expect(snapshot.source).toBe('foo');
    expect(snapshot.flags).toBe('i');
  });

  it('treats null and undefined VALUES as deletes, and an absent map as a no-op', () => {
    const editor = new LaunchArgsEditor();
    editor.modify({ a: 1, b: 2 });
    editor.modify({ a: null, b: undefined });
    expect(editor.get()).toEqual({});
    expect(editor.modify(undefined).get()).toEqual({});
    expect(editor.modify(null).get()).toEqual({});
  });

  it('resets LOCAL only, and chains like v20’s does', () => {
    const editor = new LaunchArgsEditor();
    editor.shared.modify({ kept: true });
    expect(editor.reset().modify({ fresh: 1 }).get()).toEqual({ kept: true, fresh: 1 });
    expect(editor.reset().get()).toEqual({ kept: true });
    expect(editor.shared.reset().get()).toEqual({});
  });
});

describe('the URL-blacklist serializer (v20 urlBlacklist.js)', () => {
  it('turns RegExp and arrays into a JSON array of ICU-portable patterns', () => {
    expect(serializeURLBlacklistForIOS(/foo/)).toBe('["foo"]');
    expect(serializeURLBlacklistForIOS(/foo/ims)).toBe('["(?ims:foo)"]');
    expect(serializeURLBlacklistForIOS([/a/i, 'b'])).toBe('["(?i:a)","b"]');
  });

  it('passes anything that is not a blacklist shape through untouched', () => {
    // The corpus's legacy parenthesized string form rides this branch.
    expect(serializeURLBlacklistForIOS('(\\w+)\\.jpg')).toBe('(\\w+)\\.jpg');
    expect(serializeURLBlacklistForIOS(undefined)).toBeUndefined();
  });

  it('refuses flags that do not survive the trip to ICU, and non-pattern values', () => {
    for (const flag of ['g', 'y', 'd', 'u', 'v']) {
      expect(() => serializeURLBlacklistForIOS(new RegExp('x', flag))).toThrowError(TypeError);
    }
    expect(() => serializeURLBlacklistForIOS([42])).toThrowError(
      /must be a RegExp, string, or an array of RegExp\/string values, got number/,
    );
  });
});

describe('DetoxConstants', () => {
  it('carries the identifiers the FROZEN native matches on', () => {
    expect(DetoxConstants.userActivityTypes.browsingWeb).toBe('NSUserActivityTypeBrowsingWeb');
    expect(DetoxConstants.userActivityTypes.searchableItem).toBe('com.apple.corespotlightitem');
    expect(DetoxConstants.searchableItemActivityIdentifier).toBe(
      'kCSSearchableItemActivityIdentifier',
    );
    expect(DetoxConstants.userNotificationTriggers.push).toBe('push');
  });
});
