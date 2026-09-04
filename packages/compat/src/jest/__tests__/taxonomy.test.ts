/** The code-name stamp: message and stack, in place, once. */
import { describe, expect, it } from 'vitest';
import { DetoxError, DetoxErrorCode } from 'detox/client';

import { detoxCodeName, stampDetoxCodeName } from '../taxonomy';

describe('detoxCodeName', () => {
  it('names a known code', () => {
    expect(detoxCodeName(DetoxErrorCode.DETOX_SERVER_UNREACHABLE)).toBe(
      'DETOX_SERVER_UNREACHABLE',
    );
    expect(detoxCodeName(DetoxErrorCode.DETOX_EXPECTATION_FAILED)).toBe(
      'DETOX_EXPECTATION_FAILED',
    );
  });

  it('answers undefined for foreign or absent codes', () => {
    expect(detoxCodeName(999_999)).toBeUndefined();
    expect(detoxCodeName('2004')).toBeUndefined();
    expect(detoxCodeName(undefined)).toBeUndefined();
  });
});

describe('stampDetoxCodeName', () => {
  it('prefixes the code name onto message and the stack copy of it, ONCE', () => {
    const err = new DetoxError('Could not connect to ws://x', {
      code: DetoxErrorCode.DETOX_SERVER_UNREACHABLE,
    });
    stampDetoxCodeName(err);
    expect(err.message).toBe('DETOX_SERVER_UNREACHABLE: Could not connect to ws://x');
    const stampedLines = (err.stack ?? '').split('DETOX_SERVER_UNREACHABLE').length - 1;
    expect(stampedLines).toBe(1);
    // Idempotent — a second stamp changes nothing.
    stampDetoxCodeName(err);
    expect(err.message).toBe('DETOX_SERVER_UNREACHABLE: Could not connect to ws://x');
  });

  /**
   * @issue DTX-4069
   * A fresh error whose `.stack` has never been read: the stamp must read it before mutating
   * the message, or V8 renders the stack with the stamped message and the replace stamps the
   * embedded original a second time.
   */
  it('does not double-stamp a lazily materialized stack', () => {
    const err = Object.assign(new Error('boom happened'), {
      code: DetoxErrorCode.DETOX_APP_DIED,
    });
    stampDetoxCodeName(err);
    expect(err.message).toBe('DETOX_APP_DIED: boom happened');
    expect((err.stack ?? '').split('DETOX_APP_DIED').length - 1).toBe(1);
  });

  it('leaves untyped errors, frozen errors and non-errors alone', () => {
    const plain = new Error('no code here');
    stampDetoxCodeName(plain);
    expect(plain.message).toBe('no code here');

    const frozen = Object.freeze(
      Object.assign(new Error('frozen'), { code: DetoxErrorCode.DETOX_ABORTED }),
    );
    expect(() => stampDetoxCodeName(frozen)).not.toThrow();

    expect(() => stampDetoxCodeName(null)).not.toThrow();
    expect(() => stampDetoxCodeName('a string')).not.toThrow();
    expect(() => stampDetoxCodeName({ code: 12345, message: 'foreign code' })).not.toThrow();
  });
});
