import { describe, it, expect } from 'vitest';

import { DetoxErrorCode, NoMatchingDeviceError, errorFromWire } from '../errors';

/**
 * `errorFromWire — classification is by code, never by message` in
 * errors.test.ts exercises `DETOX_POOL_EXHAUSTED` explicitly and every
 * `DetoxConnectionError`-family code (plus `DETOX_ABORTED`) through its
 * "reconstructs every code" loop — but that loop's list stops one code
 * short: `DETOX_NO_MATCHING_DEVICE` has its own registered factory in
 * `ERROR_CLASSES` (spec 004's registry) that nothing calls `errorFromWire`
 * with. A terminal-refusal response (`allocate` finding nothing that could
 * ever match, e.g. from a version-skewed server relaying the code straight
 * off the wire) is exactly the shape that would take this path.
 */
describe('errorFromWire — the DETOX_NO_MATCHING_DEVICE factory', () => {
  it('reconstructs a NoMatchingDeviceError, code and details intact', () => {
    const err = errorFromWire(DetoxErrorCode.DETOX_NO_MATCHING_DEVICE, 'No simulator matching {}', {
      query: {},
    });

    expect(err).toBeInstanceOf(NoMatchingDeviceError);
    expect(err.name).toBe('NoMatchingDeviceError');
    expect(err.code).toBe(DetoxErrorCode.DETOX_NO_MATCHING_DEVICE);
    expect(err.details).toEqual({ query: {} });
  });
});
