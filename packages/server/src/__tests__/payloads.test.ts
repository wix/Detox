/** The payload materializer (spec 006): serialization's byte cap, and a materialized file's round-trip and disposal. */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, it, expect, vi } from 'vitest';
import { DetoxErrorCode } from '@detox-remote/core';

import {
  PAYLOAD_VALUE_MAX_BYTES,
  disposeQuietly,
  materializePayload,
  serializePayloadValue,
} from '../payloads';
import { serverLog } from '../log-sink';

/**
 * @issue DTX-6034
 * The byte cap is boundary-exact — the accept suite proves "way over
 * refuses", but only a unit can pin that exactly-1-MiB passes while one more
 * byte refuses.
 */
describe('serializePayloadValue — the 1 MiB cap, boundary-exact', () => {
  // JSON.stringify of a plain ASCII string adds exactly two quote bytes.
  const stringOfSerializedBytes = (bytes: number): string => 'a'.repeat(bytes - 2);

  it('passes exactly 1 MiB of serialized JSON', () => {
    const value = stringOfSerializedBytes(PAYLOAD_VALUE_MAX_BYTES);
    expect(serializePayloadValue('userNotification', value)).toHaveLength(PAYLOAD_VALUE_MAX_BYTES);
  });

  it('refuses 1 MiB + 1 byte, typed, naming the numbers', () => {
    const value = stringOfSerializedBytes(PAYLOAD_VALUE_MAX_BYTES + 1);
    expect(() => serializePayloadValue('userNotification', value)).toThrowError(
      expect.objectContaining({
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: {
          parameter: 'userNotification',
          bytes: PAYLOAD_VALUE_MAX_BYTES + 1,
          maxBytes: PAYLOAD_VALUE_MAX_BYTES,
        },
      }),
    );
  });

  it('counts UTF-8 BYTES, not code units — the wire cap is a byte cap', () => {
    // 'é' is two UTF-8 bytes; half a MiB of them (plus quotes) is over half in
    // length but the byte count is what must decide.
    const value = 'é'.repeat((PAYLOAD_VALUE_MAX_BYTES - 2) / 2);
    expect(() => serializePayloadValue('userActivity', `${value}aa`)).toThrowError(
      expect.objectContaining({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT }),
    );
    expect(serializePayloadValue('userActivity', value)).toBeTypeOf('string');
  });

  it('refuses an unserializable value typed, never with a raw TypeError', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => serializePayloadValue('userNotification', cyclic)).toThrowError(
      expect.objectContaining({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT }),
    );
    // JSON.stringify(undefined) is undefined, not a throw — same refusal.
    expect(() => serializePayloadValue('userNotification', undefined)).toThrowError(
      expect.objectContaining({ code: DetoxErrorCode.DETOX_INVALID_ARGUMENT }),
    );
  });
});

describe('materializePayload', () => {
  /**
   * @issue DTX-6037
   * `dispose()` is memoized: a successful payload launch leaves two live
   * disposers (the retained undo-ledger entry and the session death hook),
   * and two concurrent `rm -rf`s of one tree can trip each other into
   * ENOTEMPTY, which would make a late cancel report `undo-failed` about a
   * rollback that in fact succeeded. One shared promise makes every route
   * see the same, single removal — a second `dispose()` call resolves clean.
   */
  it('writes the exact JSON to a private dir and dispose() removes it — idempotently', async () => {
    const json = JSON.stringify({ title: 'spec 006', answer: 42 });
    const payload = await materializePayload('userNotification', json);
    expect(path.isAbsolute(payload.path)).toBe(true);
    expect(path.basename(payload.path)).toBe('userNotification.json');
    expect(await readFile(payload.path, 'utf8')).toBe(json);

    await payload.dispose();
    expect(existsSync(payload.path)).toBe(false);
    await expect(payload.dispose()).resolves.toBeUndefined();
  });

  /**
   * @issue DTX-6036
   * Disposal for death hooks is fire-and-forget, logged-never-thrown: a
   * session's death cleanup must not become an unhandled rejection, but a
   * file the OS would not give back is worth a log line, not silence.
   */
  it('disposeQuietly logs a refusing filesystem instead of throwing (death hooks must not crash)', async () => {
    const consoleError = vi.spyOn(serverLog, 'error').mockImplementation(() => undefined);
    try {
      disposeQuietly({ path: '/nowhere', dispose: () => Promise.reject(new Error('EPERM')) });
      await vi.waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining('payload file cleanup failed:'),
        );
      });
    } finally {
      consoleError.mockRestore();
    }
  });

  it('two payloads never share a directory (concurrent launches cannot clobber)', async () => {
    const one = await materializePayload('userActivity', '{"a":1}');
    const two = await materializePayload('userActivity', '{"a":2}');
    expect(path.dirname(one.path)).not.toBe(path.dirname(two.path));
    await one.dispose();
    expect(await readFile(two.path, 'utf8')).toBe('{"a":2}');
    await two.dispose();
  });
});
