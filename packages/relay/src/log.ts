/**
 * The relay's log voice. Every line this package emits goes through here so
 * everything says `[relay]` — the accept helper and an operator's log both
 * key on the prefix, and a relay that talks like a server (`[server]`)
 * would be indistinguishable in a mixed log. Reused server modules get the
 * prefix through their own seams (`BlobStore`'s `logPrefix`,
 * `startKeepalive`'s third argument).
 */
export const RELAY_LOG_PREFIX = '[relay]';

export function relayLog(message: string): void {
  console.log(`${RELAY_LOG_PREFIX} ${message}`);
}

export function relayError(message: string): void {
  console.error(`${RELAY_LOG_PREFIX} ${message}`);
}
