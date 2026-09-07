/**
 * Runtime error classes of the public dialect, re-exported here to avoid a
 * cycle through `../client`. Single definition site is
 * `@detox-remote/core`: the server stamps the same numbers and cannot import
 * `detox`, so core is the only package both sides can share.
 */
export {
  DetoxError,
  AbortError,
  DetoxConnectionError,
  DevicePoolExhaustedError,
  NoMatchingDeviceError,
  DeviceUnknownStateError,
  DetoxErrorCode,
} from '@detox-remote/core';
export type { DetoxErrorOptions } from '@detox-remote/core';
