import { describe, it, expect } from 'vitest';

import { cutChildOutput } from '../child-output';

describe('cutChildOutput (spec 013)', () => {
  it('cuts a stream into lines — CRLF stripped, the trailing newline no line — within the byte budget, then says truncated', () => {
    expect(cutChildOutput('', 100)).toEqual({ lines: [], truncated: false });
    expect(cutChildOutput('one\r\ntwo\n', 100)).toEqual({ lines: ['one', 'two'], truncated: false });
    expect(cutChildOutput('no newline at the end', 100)).toEqual({ lines: ['no newline at the end'], truncated: false });
    expect(cutChildOutput('one\ntwo\nthree is long\nfour\n', 12)).toEqual({ lines: ['one', 'two'], truncated: true });
    expect(cutChildOutput('€€€\n', 4)).toEqual({ lines: [], truncated: true });
  });
});
