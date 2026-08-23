/**
 * The version announce.
 *
 * @issue DTX-2004: the first frame a serving door sends on every fresh
 * connection is the `$/serverInfo` notification.
 *
 * Unknown notifications are ignored by every peer, so an old client meeting
 * a new server degrades to today's behavior instead of crashing.
 *
 * @issue DTX-2005: identity is hop-pairwise, like auth — a relay
 * announces its own versions to its clients.
 * @issue DTX-7018: …and consumes a node's announce itself, so a client is
 * never shown a version it is not actually talking to.
 *
 * `protocol` is compared, never parsed: bump it on any wire change an old
 * counterpart cannot safely ignore. `server` is the serving package's own
 * version string, for humans and error messages only.
 */
export const PROTOCOL_VERSION = 1;

export const SERVER_INFO_METHOD = '$/serverInfo';

/**
 * @issue DTX-2006: the ws close code a client uses when it refuses a
 * mismatched protocol maps to `DETOX_VERSION_SKEW`, so every pending call
 * settles typed, not as a generic connection loss.
 *
 * (4001 is the keepalive verdict; 4000-range codes are this wire's own
 * registry.)
 */
export const VERSION_SKEW_CLOSE_CODE = 4002;

export interface ServerInfoNotification {
  protocol: number;
  server: string;
}
