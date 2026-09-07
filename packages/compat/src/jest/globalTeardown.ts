/**
 * `detox/runners/jest/globalTeardown` — closes the session this process
 * holds, if any (spec 010's runner contract).
 *
 * Worker mode: workers are gone before this runs; their sockets died with them and the server
 * reclaimed in ms, so the box here is empty and this is a no-op. In-band
 * (`--runInBand`): jest's main process ran the tests, so the module-state session lives here
 * and would otherwise hold the event loop; a bare close is the whole teardown (never
 * defeated by an abort, no grace, no timer).
 */
import { cleanup } from '../index';
import { compatStateBox } from '../state';

export default async function globalTeardown(): Promise<void> {
  const box = compatStateBox();
  if (box.state !== undefined || box.pendingInit !== undefined) {
    await cleanup();
  }
}
