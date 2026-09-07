/**
 * The dialing half of the blob lane (spec 007): `HEAD` "do you have these
 * bytes" and `PUT` "here they are", spoken as plain HTTP(S) against the same
 * host:port a command channel upgrades on, with the same headers.
 *
 * Lives in core because one implementation serves both callers: the `detox`
 * client uses it to push a build to its server; the relay (spec 008) uses
 * the identical class to push the same build one hop further, node-ward.
 *
 * URL-root contract (spec 008): the lane lives at `/v1/blobs/` from the URL
 * root on every hop — this class keeps only host:port of the ws URL and
 * drops its path, so a path-routing front (`wss://host/team-a/` → different
 * backends) is unsupported for the lane.
 */
import { createReadStream } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

import { AbortError } from './errors';

/** The one path shape of the lane. */
export function blobLanePath(hex: string): string {
  return `/v1/blobs/sha256/${hex}`;
}

/**
 * Where a blob lane lives: a ws(s) URL whose host:port also answers plain
 * HTTP(S), plus the handshake headers (the bearer token rides here).
 * Structurally identical to the client's `DetoxServerAddress`.
 */
export interface BlobLaneAddress {
  url: string;
  headers?: Record<string, string>;
}

export interface BlobPutOptions {
  /** The archive to stream as the request body. */
  archivePath: string;
  /** Its size — the lane's admission needs the length up front. */
  bytes: number;
  signal?: AbortSignal;
  /** Called per chunk as the body streams — the narration's byte source. */
  onBytes?: (chunkBytes: number) => void;
}

interface BlobRequestOptions extends Partial<BlobPutOptions> {
  signal?: AbortSignal;
}

/**
 * The lane speaks plain HTTP(S) on the same host:port the command channel
 * upgrades on, with the same headers — no new listener, port, route family
 * or token. `ws:` maps to `http:`, `wss:` to `https:`.
 */
export class BlobLaneClient {
  readonly #secure: boolean;
  readonly #host: string;
  readonly #port: number | undefined;
  readonly #headers: Record<string, string>;

  constructor(address: BlobLaneAddress) {
    const wsUrl = new URL(address.url);
    this.#secure = wsUrl.protocol === 'wss:';
    // URL keeps an IPv6 literal's brackets in `.hostname` ('[::1]'), but
    // `http.request({host})` treats that as a DNS name and ENOTFOUNDs —
    // while `ws` dials the same URL fine, so only the lane would break on a
    // `--host ::1` server.
    this.#host = wsUrl.hostname.replace(/^\[|\]$/g, '');
    this.#port = wsUrl.port ? Number(wsUrl.port) : undefined;
    this.#headers = { ...address.headers };
  }

  /** Status of `HEAD /v1/blobs/sha256/<hex>` — 200 means the server holds the bytes. */
  head(hex: string, signal?: AbortSignal): Promise<number> {
    return this.#request('HEAD', hex, { signal });
  }

  /** Status of `PUT` streaming the archive — 201 stored fresh, 200 already there. */
  put(hex: string, options: BlobPutOptions): Promise<number> {
    return this.#request('PUT', hex, options);
  }

  #request(method: 'HEAD' | 'PUT', hex: string, options: BlobRequestOptions): Promise<number> {
    const { archivePath, bytes, signal, onBytes } = options;
    return new Promise<number>((resolve, reject) => {
      const request = this.#secure ? httpsRequest : httpRequest;
      const req = request(
        {
          host: this.#host,
          port: this.#port,
          method,
          path: blobLanePath(hex),
          headers:
            bytes === undefined
              ? this.#headers
              : { ...this.#headers, 'Content-Length': String(bytes) },
          signal,
        },
        (res) => {
          res.resume(); // bodies are unspecified — only the status is contract
          res.once('end', () => {
            resolve(res.statusCode ?? 0);
            // A refusal can arrive while the body is still streaming; once
            // the status is in hand, pushing more bytes at a server that
            // already answered is pure waste.
            req.destroy();
          });
        },
      );
      req.once('error', (err) => {
        reject(signal?.aborted ? new AbortError(signal.reason) : err);
      });
      if (archivePath === undefined) {
        req.end();
        return;
      }
      const body = createReadStream(archivePath);
      // `pipe` alone never destroys its source: an abort or socket error
      // would leave the archive's fd open (and its unlinked blocks pinned)
      // for the life of the process. 'close' fires on every ending of the
      // request — success, abort, reset — and destroying an ended stream is
      // a no-op.
      req.once('close', () => body.destroy());
      body.once('error', (err) => {
        req.destroy();
        reject(err);
      });
      if (onBytes) body.on('data', (chunk: Buffer | string) => onBytes(chunk.length));
      body.pipe(req);
    });
  }
}
