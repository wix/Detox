/**
 * Raw HTTP client for the blob lane (spec 007) — the fixture half of the
 * upload-lane accept tests.
 *
 * Why a raw client belongs in an accept helper at all: the lane's HTTP
 * surface is a public wire contract — the future relay speaks these same
 * verbs against a node, the same way `fake-app.ts` speaks the frozen app
 * dialect against the gateway. The product's own client exercises the happy
 * path through `device.installApp`; this helper plays the other parties —
 * a wrong-digest uploader, an unauthorized caller, a connection that dies
 * mid-body — which the public API cannot stage.
 *
 * "Externally" semantics as everywhere in these helpers: node's own http
 * client and crypto, behind the product's back.
 */
import { createHash } from 'node:crypto';
import { request } from 'node:http';

import type { DetoxServerAddress } from 'detox/internals';

/** The one path shape of the lane. */
function blobPath(hex: string): string {
  return `/v1/blobs/sha256/${hex}`;
}

export function sha256HexExternally(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Counts how many blobs the server reports having freshly stored. The exact
 * log wording is pinned here, in an editable helper, not in the frozen
 * accept file: a hardcoded regex in a frozen file would freeze the prose
 * forever. The accept tests pin the count; the implementation and this line
 * may rephrase together.
 */
export function countBlobStores(logs: string): number {
  return logs.match(/blob stored — sha256\//g)?.length ?? 0;
}

export interface BlobRequestOptions {
  /** Send the real bearer header (default) or none at all (`false`). */
  authorized?: boolean;
}

export interface BlobLane {
  /** Status code of `HEAD /v1/blobs/sha256/<hex>`. */
  head(hex: string, options?: BlobRequestOptions): Promise<number>;
  /** Status code of `PUT /v1/blobs/sha256/<hex>` with `body` as the bytes. */
  put(hex: string, body: Buffer, options?: BlobRequestOptions): Promise<number>;
  /** Status code of a `GET` on the same path — the lane must not serve one. */
  get(hex: string): Promise<number>;
  /**
   * A `PUT` that declares the full Content-Length, sends only `sendBytes`
   * of the body, then destroys its socket — a client dying mid-upload.
   * Resolves once the socket is gone; there is no status to return, the
   * peer never finished the request.
   */
  putInterrupted(hex: string, body: Buffer, sendBytes: number): Promise<void>;
}

/**
 * The lane speaks plain HTTP on the same host:port the command channel
 * upgrades on: no new listener, port, route family or token. Named `dial…`,
 * not `…Of`: the `-Of` suffix is the typed-door convention, and this is not
 * a door.
 */
export function dialBlobLane(address: DetoxServerAddress): BlobLane {
  const wsUrl = new URL(address.url);
  const host = wsUrl.hostname;
  const port = Number(wsUrl.port);
  const authHeaders: Record<string, string> = { ...address.headers };

  function send(
    method: 'HEAD' | 'PUT' | 'GET',
    hex: string,
    body?: Buffer,
    options?: BlobRequestOptions,
  ): Promise<number> {
    const headers: Record<string, string> = options?.authorized === false ? {} : { ...authHeaders };
    if (body) headers['Content-Length'] = String(body.length);
    return new Promise<number>((resolve, reject) => {
      const req = request({ host, port, method, path: blobPath(hex), headers }, (res) => {
        res.resume(); // drain; only the status is the contract here
        res.once('end', () => resolve(res.statusCode ?? 0));
      });
      req.once('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }

  return {
    head: (hex, options) => send('HEAD', hex, undefined, options),
    put: (hex, body, options) => send('PUT', hex, body, options),
    get: (hex) => send('GET', hex),
    putInterrupted: (hex, body, sendBytes) =>
      new Promise<void>((resolve) => {
        const req = request({
          host,
          port,
          method: 'PUT',
          path: blobPath(hex),
          headers: { ...authHeaders, 'Content-Length': String(body.length) },
        });
        // The server may kill the socket first (it must not, but this helper
        // must not hang if it does) — either side closing settles the promise.
        req.once('error', () => resolve());
        req.once('close', () => resolve());
        req.write(body.subarray(0, sendBytes), () => {
          // Flushed the partial body — now vanish without end(): the peer sees
          // a connection that promised more bytes and died.
          req.destroy();
        });
      }),
  };
}
