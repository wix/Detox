/* eslint-disable import/no-unresolved,node/no-missing-import,node/no-unsupported-features/es-syntax */

/**
 * A serializable object that represents a device.
 */
export interface DeviceCookie {
  /** The device's unique identifier. */
  id: string;
  /** The display name of the device. */
  name?: string;
}

