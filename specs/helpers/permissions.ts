/**
 * Ground truth about simulator permissions, read without going through the
 * client (spec 006). TCC-backed services only: the simulator's TCC database
 * is where both backends (`simctl privacy` and applesimutils) land their
 * camera/photos/microphone/… grants. Notification/health/homekit state
 * lives elsewhere and has no readback here — those services are argv-pinned
 * in spec 006's integration gate instead.
 *
 * Editable helper: if a future runtime moves or reshapes TCC.db, fix this
 * file — the accept file's assertions stay frozen.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { homedir } from 'node:os';
import path from 'node:path';

const run = promisify(execFile);

/** The TCC services spec 006's accept file reads back. */
const TCC_SERVICE_NAMES: Record<string, string> = {
  camera: 'kTCCServiceCamera',
  photos: 'kTCCServicePhotos',
  microphone: 'kTCCServiceMicrophone',
  contacts: 'kTCCServiceAddressBook',
  calendar: 'kTCCServiceCalendar',
};

export type TccPermissionState = 'granted' | 'denied' | 'limited' | 'absent';

/**
 * Reads a bundle's TCC verdict for one service straight from the
 * simulator's own database. `absent` = no row (an `unset`/reset state).
 */
export async function tccServiceStateExternally(
  udid: string,
  service: string,
  bundleId: string,
  signal?: AbortSignal,
): Promise<TccPermissionState> {
  const tccService = TCC_SERVICE_NAMES[service];
  if (!tccService) {
    throw new Error(`tccServiceStateExternally: no TCC readback for service "${service}"`);
  }
  const db = path.join(
    homedir(),
    'Library/Developer/CoreSimulator/Devices',
    udid,
    'data/Library/TCC/TCC.db',
  );
  const { stdout } = await run(
    'sqlite3',
    [db, `SELECT auth_value FROM access WHERE service='${tccService}' AND client='${bundleId}';`],
    { signal },
  );
  const raw = stdout.trim();
  if (raw === '') return 'absent';
  // TCC auth_value: 0 denied, 1 unknown, 2 allowed, 3 limited.
  const value = Number(raw.split('\n').pop());
  if (value === 2) return 'granted';
  if (value === 3) return 'limited';
  return 'denied';
}
