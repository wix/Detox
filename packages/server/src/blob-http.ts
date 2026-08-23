/**
 * The HTTP half of the blob lane (spec 007): `PUT` and `HEAD`
 * on `/v1/blobs/sha256/<hex>`, on the server's existing port, bearer-checked
 * by the same `isAuthorized` as the command channel. No new listener, port,
 * route family or token anywhere — and no download URL is ever minted: `GET`
 * answers 404 even for a present blob, so the negative space reveals nothing
 * about store contents (the same shape as a stale device handle: 404 rather
 * than 405 for the same reason).
 *
 * Status vocabulary (the whole response contract — bodies are unspecified):
 *   201 stored fresh · 200 already present (HEAD hit or idempotent re-PUT) ·
 *   400 malformed name, digest mismatch, or declared length not honored ·
 *   401 auth · 404 not found / not a lane verb · 411 PUT without a
 *   Content-Length (admission needs the size up front) · 413 a blob larger
 *   than the whole budget · 507 no room can be made, everything is pinned.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';

import { isAuthorized, type AuthConfig } from './auth';
import { BlobRefusal, SHA256_HEX_RE, type BlobStore } from './BlobStore';

export const BLOB_LANE_PREFIX = '/v1/blobs/';

/** Routes by prefix so a malformed blob name stays a lane answer (400), not a generic 404. */
export function isBlobLaneRequest(req: IncomingMessage): boolean {
  return (req.url ?? '').startsWith(BLOB_LANE_PREFIX);
}

export interface BlobLaneDeps {
  store: BlobStore;
  /** Absent → open door — auth is opt-in and off by default. */
  auth?: AuthConfig;
}

/**
 * Answers one lane request. Never rejects: an uploader whose socket died
 * mid-body has no address to answer, and nothing else may take the server
 * down with it (the caller `void`s this promise).
 */
export async function handleBlobLaneRequest(
  req: IncomingMessage,
  res: ServerResponse,
  { store, auth }: BlobLaneDeps,
): Promise<void> {
  try {
    await route(req, res, store, auth);
  } catch {
    // A torn-down response mid-answer — nobody left to tell.
  }
}

async function route(
  req: IncomingMessage,
  res: ServerResponse,
  store: BlobStore,
  auth: AuthConfig | undefined,
): Promise<void> {
  // @issue DTX-6203: auth runs before the name is parsed — an unauthorized
  // caller learns and stores nothing.
  if (!isAuthorized(req, auth)) return refuse(req, res, 401);

  const rest = (req.url ?? '').slice(BLOB_LANE_PREFIX.length);
  const [algo, hex, ...extra] = rest.split('/');
  const wellNamed = algo === 'sha256' && extra.length === 0 && SHA256_HEX_RE.test(hex ?? '');

  switch (req.method) {
    case 'HEAD': {
      if (!wellNamed) return finish(res, 400);
      if (!store.has(hex)) return finish(res, 404);
      store.touch(hex); // @issue DTX-6204: a HEAD hit counts as a use (LRU, #50 rider)
      return finish(res, 200);
    }
    case 'PUT': {
      if (!wellNamed) return refuse(req, res, 400);
      const declared = req.headers['content-length'];
      if (declared === undefined) return refuse(req, res, 411);
      try {
        const outcome = await store.put(hex, req, Number(declared));
        if (outcome === 'already-present') {
          req.resume(); // hash hit — the body is noise, but the status deserves a clean read
          return finish(res, 200);
        }
        return finish(res, 201);
      } catch (err) {
        if (err instanceof BlobRefusal) return refuse(req, res, err.status);
        // The uploader died mid-body (nothing stored, nobody to answer), or
        // the filesystem failed under us — answer if the socket still can,
        // and never leave a half-consumed request parked on a keep-alive.
        if (!res.headersSent && !res.writableEnded) refuse(req, res, 500);
        else req.destroy();
        return;
      }
    }
    default:
      return refuse(req, res, 404);
  }
}

function finish(res: ServerResponse, status: number): void {
  res.statusCode = status;
  res.end();
}

/**
 * Status first, then drain at most this much: an unread body makes
 * `destroy()` send RST and lose the status; an unbounded drain reads a
 * declared length for nothing.
 */
const REFUSAL_DRAIN_CAP_BYTES = 1024 * 1024;

export function refuse(req: IncomingMessage, res: ServerResponse, status: number): void {
  res.statusCode = status;
  res.setHeader('Connection', 'close');
  res.end();
  let drained = 0;
  req.on('data', (chunk: Buffer) => {
    drained += chunk.length;
    if (drained > REFUSAL_DRAIN_CAP_BYTES) req.destroy();
  });
  req.resume();
}
