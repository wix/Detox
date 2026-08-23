/**
 * A witness on the host's loopback: a tiny HTTP listener that records which
 * paths were requested.
 *
 * The one thing a simulator can prove to a test without an app under test is
 * "somebody fetched your URL": the simulator shares the host's network
 * stack, so `openURL` pointed at 127.0.0.1 here must produce a request
 * bearing the token path — a no-op `openURL` cannot fake that. A cold
 * Safari makes its first request slowly (~40 s observed), hence the
 * generous default timeout; the fixture additionally warms Safari via
 * {@link import('./simctl').launchAppExternally} first.
 */
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

import { waitUntil, type WaitUntilOptions } from './simctl';

export interface ProbeWebServer {
  /** Absolute URL for `path` on this server, e.g. `urlFor('/token')`. */
  urlFor(path: string): string;
  /** Resolves once `path` has been requested; rejects on timeout. */
  sawRequest(path: string, options?: WaitUntilOptions): Promise<void>;
  close(): Promise<void>;
}

export async function startProbeWebServer(): Promise<ProbeWebServer> {
  const seen = new Set<string>();
  const server = createServer((request, response) => {
    seen.add(request.url ?? '/');
    response.writeHead(204);
    response.end();
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });
  const { port } = server.address() as AddressInfo;
  return {
    urlFor: (path) => `http://127.0.0.1:${String(port)}${path}`,
    sawRequest: (path, options = {}) =>
      waitUntil(() => seen.has(path), {
        timeoutMs: 120_000,
        description: `a request for ${path}`,
        ...options,
      }),
    close: () =>
      new Promise<void>((resolve, reject) => {
        // Safari keeps its connection alive; close() alone would wait it out.
        server.closeAllConnections();
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      }),
  };
}
