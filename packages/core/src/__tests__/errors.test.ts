import { describe, it, expect } from 'vitest';

import { memoryChannel, Peer } from '..';
import {
  AbortError,
  DetoxConnectionError,
  DetoxError,
  DetoxErrorCode,
  DevicePoolExhaustedError,
  NoMatchingDeviceError,
  errorFromWire,
  toWireError,
} from '../errors';

interface WireRequestLike {
  id: string;
}

/**
 * Spec 004's implementation notes call these out as untestable through the
 * public dialect (`instanceof`, and "classify by code never by message" are
 * techniques, not observables) and ask for unit-level coverage instead.
 */
describe('the error taxonomy (spec 004)', () => {
  describe('class hierarchy', () => {
    it('roots every subclass at DetoxError, with the names accept-001/004 freeze', () => {
      expect(new AbortError()).toBeInstanceOf(DetoxError);
      expect(new AbortError().name).toBe('AbortError');

      const connectionErr = new DetoxConnectionError('x', { code: DetoxErrorCode.DETOX_CONNECTION_LOST });
      expect(connectionErr).toBeInstanceOf(DetoxError);
      expect(connectionErr.name).toBe('DetoxConnectionError');

      expect(new DevicePoolExhaustedError('x').name).toBe('DevicePoolExhaustedError');
      expect(new NoMatchingDeviceError('x').name).toBe('NoMatchingDeviceError');

      // A code with no subclass of its own rides the base, verbatim.
      expect(new DetoxError('x', { code: 2050 }).name).toBe('DetoxError');
    });

    it('carries the reserved codes without needing the wire', () => {
      expect(new DevicePoolExhaustedError('x').code).toBe(DetoxErrorCode.DETOX_POOL_EXHAUSTED);
      expect(new NoMatchingDeviceError('x').code).toBe(DetoxErrorCode.DETOX_NO_MATCHING_DEVICE);
      expect(new AbortError().code).toBe(DetoxErrorCode.DETOX_ABORTED);
    });
  });

  describe('toWireError — the frame a handler throw serializes to', () => {
    it('puts a DetoxError code directly on the wire, never wrapped in -32000', () => {
      const err = new DevicePoolExhaustedError('All 1 device slots are busy', {
        details: { maxPool: 1, holders: [] },
      });
      expect(toWireError(err)).toEqual({
        code: DetoxErrorCode.DETOX_POOL_EXHAUSTED,
        message: 'All 1 device slots are busy',
        data: { maxPool: 1, holders: [] },
      });
    });

    it('keeps the JSON-RPC generic fallback for a plain, unclassified throw', () => {
      expect(toWireError(new Error('boom'))).toEqual({ code: -32000, message: 'boom' });
    });
  });

  describe('errorFromWire — classification is by code, never by message', () => {
    it('builds the same class from the same code regardless of what the message says', () => {
      const a = errorFromWire(DetoxErrorCode.DETOX_POOL_EXHAUSTED, 'a first sentence', { maxPool: 1 });
      const b = errorFromWire(DetoxErrorCode.DETOX_POOL_EXHAUSTED, 'a completely different sentence', {
        maxPool: 1,
      });
      expect(a.constructor).toBe(DevicePoolExhaustedError);
      expect(a.constructor).toBe(b.constructor);
    });

    it('degrades an unrecognized Detox code to the base class, code and details intact', () => {
      // The version-skew story: a server newer than this client build sent a
      // code this map has no class for yet.
      const err = errorFromWire(2050, 'a future release invented this', { future: true });
      expect(err.constructor).toBe(DetoxError);
      expect(err.code).toBe(2050);
      expect(err.details).toEqual({ future: true });
    });

    it('folds -32601 (method not found) into DETOX_INTERNAL — the "report an issue" family', () => {
      const err = errorFromWire(-32601, 'Method not found: bogusMethod');
      expect(err.code).toBe(DetoxErrorCode.DETOX_INTERNAL);
      expect(err.details?.jsonRpcCode).toBe(-32601);
    });

    it('folds every other JSON-RPC code into DETOX_UNCLASSIFIED, preserving the original code', () => {
      const err = errorFromWire(-32000, 'simctl boot failed');
      expect(err.code).toBe(DetoxErrorCode.DETOX_UNCLASSIFIED);
      expect(err.details?.jsonRpcCode).toBe(-32000);
    });

    it('folds -32800 (cancelled) into DETOX_ABORTED — the map header names it in-use', () => {
      const err = errorFromWire(-32800, 'Request cancelled');
      expect(err.code).toBe(DetoxErrorCode.DETOX_ABORTED);
      expect(err.name).toBe('AbortError');
    });

    /**
     * @issue DTX-1013
     * The `DETOX_ABORTED` factory threads `details` through rather than
     * taking only `cause`: a consumer that rebuilds an `AbortError` from the
     * wire without going through `Peer` (a relay forwarding a node's answer,
     * a fake peer in a test) needs what the responder attached — the
     * rollback outcome above all — to survive reconstruction.
     */
    it('keeps what a cancellation answer attached, instead of rebuilding a bare AbortError', () => {
      const err = errorFromWire(-32800, 'Request cancelled', { outcome: 'undo-failed' });
      expect(err.name).toBe('AbortError');
      expect(err.details).toEqual({ outcome: 'undo-failed' });
    });

    it('reconstructs every code that has a class of its own, not just the two the accept file exercises', () => {
      const cases: Array<[number, string]> = [
        [DetoxErrorCode.DETOX_ABORTED, 'AbortError'],
        [DetoxErrorCode.DETOX_SERVER_UNREACHABLE, 'DetoxConnectionError'],
        [DetoxErrorCode.DETOX_UNAUTHORIZED, 'DetoxConnectionError'],
        [DetoxErrorCode.DETOX_CONNECTION_LOST, 'DetoxConnectionError'],
        [DetoxErrorCode.DETOX_SESSION_EXPIRED, 'DetoxConnectionError'],
        [DetoxErrorCode.DETOX_VERSION_SKEW, 'DetoxConnectionError'],
        [DetoxErrorCode.DETOX_DEVICE_UNKNOWN_STATE, 'DeviceUnknownStateError'],
      ];
      for (const [code, name] of cases) {
        const err = errorFromWire(code, 'x');
        expect(err.name).toBe(name);
        expect(err.code).toBe(code);
      }
    });

    /**
     * The wedged-device verdict has to survive the wire with its payload: the
     * caller needs the udid to say which device left the fleet, and a class
     * that dropped `details` would make the log line the only record.
     */
    it('carries the wedged-device details across the wire (spec 005)', () => {
      const err = errorFromWire(DetoxErrorCode.DETOX_DEVICE_UNKNOWN_STATE, 'erase was killed', {
        udid: 'udid-1',
        timeoutMs: 60_000,
      });
      expect(err.name).toBe('DeviceUnknownStateError');
      expect(err.details).toEqual({ udid: 'udid-1', timeoutMs: 60_000 });
    });
  });

  describe('end to end over a channel — a client older than the code it receives', () => {
    it('surfaces an unrecognized code as base DetoxError instead of crashing or dropping it', async () => {
      const [clientCh, fakePeerCh] = memoryChannel();
      const client = Peer.create(clientCh);

      // A hand-rolled responder, not `Peer`: a server ahead of this client
      // build, answering with a code this map has no class for.
      fakePeerCh.onMessage((msg) => {
        const { id } = msg as WireRequestLike;
        fakePeerCh.send({
          jsonrpc: '2.0',
          id,
          error: { code: 2050, message: 'a code from the future', data: { hint: 'upgrade' } },
        });
      });

      let err: DetoxError | undefined;
      await client.request({ method: 'allocateDevice' }).catch((e: unknown) => {
        err = e as DetoxError;
      });

      expect(err).toBeInstanceOf(DetoxError);
      expect(err?.name).toBe('DetoxError');
      expect(err?.code).toBe(2050);
      expect(err?.details).toEqual({ hint: 'upgrade' });
    });
  });
});
