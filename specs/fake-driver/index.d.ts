/**
 * The fake driver's typed doors (spec 015), the example a driver package
 * follows: its `createDriver` is typed against the contract published
 * through `detox/server`, and it augments `detox/client`'s `AllocationMap`
 * with its own entry — its query vocabulary and its device descriptor —
 * exactly as a jest matcher package augments `expect`. Nothing here is a
 * udid: the descriptor is the driver's.
 */
import type { DriverModule } from 'detox/server';

declare module 'detox/client' {
  interface AllocationMap {
    'spec015-fake-driver': {
      query: { id?: string; name?: string };
      info: { id: string };
    };
  }
}

export const createDriver: DriverModule['createDriver'];
