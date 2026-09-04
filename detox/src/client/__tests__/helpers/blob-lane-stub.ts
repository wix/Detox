/**
 * A real loopback HTTP server playing the SERVER half of the blob lane
 * (spec 007) for client unit tests. The ws transport in these tests is
 * faked, but the lane speaks plain HTTP on the same host:port — so the
 * session is initialized with this stub's real address: the fake WebSocket
 * ignores it, `BlobLaneClient` dials it for real.
 *
 * Dumb on purpose: remembers which hexes were PUT, answers HEAD from that
 * memory, stores no bytes, verifies no digests — the real store's semantics
 * are gated server-side; here only the CLIENT's protocol behavior is under
 * test (probe before upload, upload once, skip on a hash hit).
 */
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface LaneRequest {
  method: string;
  path: string;
  authorization: string | undefined;
}

export interface BlobLaneStub {
  /** Hand this to `connect({ server })`: `ws://127.0.0.1:<port>`. */
  readonly url: string;
  /** Every lane request, in arrival order. */
  readonly requests: LaneRequest[];
  /** Hexes "stored" so far; pre-seed to fake a warm server. */
  readonly stored: Set<string>;
  close(): Promise<void>;
}

export async function startBlobLaneStub(): Promise<BlobLaneStub> {
  const requests: LaneRequest[] = [];
  const stored = new Set<string>();
  const server: Server = createServer((req, res) => {
    requests.push({
      method: req.method ?? '',
      path: req.url ?? '',
      authorization: req.headers.authorization,
    });
    const match = /^\/v1\/blobs\/sha256\/([0-9a-f]{64})$/.exec(req.url ?? '');
    if (!match) {
      res.statusCode = 400;
      res.end();
      return;
    }
    const hex = match[1];
    switch (req.method) {
      case 'HEAD':
        res.statusCode = stored.has(hex) ? 200 : 404;
        res.end();
        return;
      case 'PUT':
        req.resume();
        req.once('end', () => {
          const fresh = !stored.has(hex);
          stored.add(hex);
          res.statusCode = fresh ? 201 : 200;
          res.end();
        });
        return;
      default:
        res.statusCode = 404;
        res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  return {
    url: `ws://127.0.0.1:${String(port)}`,
    requests,
    stored,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
