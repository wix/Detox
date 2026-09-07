/**
 * The relay's half-step of the hop-by-hop transfer lane (spec 008: bytes are
 * "pushed hop-by-hop (client→relay→node)"). Before
 * an `installApp {blob}` verb is forwarded to a node, the relay makes sure
 * the node holds the bytes: `HEAD` the node; on a miss, `PUT` from the
 * relay's own store — the upstream half is `BlobLaneClient`, one lane
 * implementation used twice. The client never learns how many hops there are.
 *
 * Every failure here is an outcome, never a throw: the session answers the
 * verb with `DETOX_APP_TRANSFER_FAILED` (2016) carrying the reason, and the
 * client's existing single transparent HEAD→PUT→retry round repairs the one
 * self-healable case (the relay's own store evicted the blob between the
 * client's PUT and the install). No new client behavior anywhere.
 */
import { stat } from 'node:fs/promises';

import type { BlobPutOptions } from '@detox-remote/core';
import type { BlobStore } from '@detox-remote/server';

/**
 * Progress-based, never a total cap: every chunk the push moves re-arms it,
 * so a slow but live upload of any size survives; only genuine silence dies.
 * Without it, an `installApp {blob}` against a wedged lane would park the
 * client forever (the requester keeps no clock of its own) and wedge that
 * node's whole send queue behind it.
 *
 * @issue DTX-7042: a wedge detector, not a patience limit — wedged-alive means moving no bytes, and only the clock can catch it.
 */
const LANE_STALL_MS = 30_000;

export interface EnsureBlobOutcome {
  ok: boolean;
  /** Human reason on failure — becomes the 2016 message's tail. */
  reason?: string;
}

/** The two lane verbs the bridge speaks — `BlobLaneClient` satisfies this. */
export interface BlobLanePort {
  head(hex: string, signal?: AbortSignal): Promise<number>;
  put(hex: string, options: BlobPutOptions): Promise<number>;
}

export interface EnsureBlobDeps {
  /** Dials the node's lane with the node's own credentials. */
  lane: BlobLanePort;
  /** The relay's own store — the source of a push. */
  store: BlobStore;
}

export async function ensureBlobOnNode(
  { lane, store }: EnsureBlobDeps,
  hex: string,
): Promise<EnsureBlobOutcome> {
  const wedge = new AbortController();
  let stallTimer: NodeJS.Timeout | undefined;
  const armStall = (): void => {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => {
      wedge.abort(new Error('lane stall'));
    }, LANE_STALL_MS);
  };
  const stalled = (): boolean => wedge.signal.aborted;
  const stallReason = `the node's lane moved nothing for ${String(LANE_STALL_MS / 1000)} s — abandoned (wedge detector)`;
  armStall();

  try {
    let headStatus: number;
    try {
      headStatus = await lane.head(hex, wedge.signal);
    } catch {
      return {
        ok: false,
        reason: stalled()
          ? stallReason
          : "the node's blob lane could not be reached for the presence check",
      };
    }
    if (headStatus === 200) return { ok: true };
    if (headStatus !== 404) {
      return {
        ok: false,
        reason: `the node answered HTTP ${String(headStatus)} to the presence check`,
      };
    }

    // Pinned while the PUT reads it (never evict under a reader);
    // `pin` returning false is the self-heal case.
    if (!store.pin(hex)) {
      return {
        ok: false,
        reason:
          `the relay's own store no longer holds sha256/${hex} (evicted) — ` +
          're-upload to the relay and retry',
      };
    }
    try {
      const archivePath = store.pathOf(hex);
      const { size } = await stat(archivePath);
      armStall();
      const putStatus = await lane.put(hex, {
        archivePath,
        bytes: size,
        signal: wedge.signal,
        // Moving bytes is liveness — the wedge detector re-arms per chunk.
        onBytes: armStall,
      });
      if (putStatus !== 200 && putStatus !== 201) {
        return {
          ok: false,
          reason: `the node's blob lane refused the push (HTTP ${String(putStatus)})`,
        };
      }
    } catch {
      return {
        ok: false,
        reason: stalled() ? stallReason : "the push to the node's blob lane broke mid-stream",
      };
    } finally {
      store.unpin(hex);
    }
    // The push read the entry — a genuine use for the relay store's LRU.
    store.touch(hex);
    return { ok: true };
  } finally {
    clearTimeout(stallTimer);
  }
}
