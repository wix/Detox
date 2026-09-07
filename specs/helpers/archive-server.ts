/**
 * Serves a built .app bundle as an archive over local HTTP — the fixture
 * half of the URL-install tests (spec 003).
 *
 * "Externally" in the name means what it means everywhere in these helpers:
 * the zipping and the serving happen behind the product's back, with system
 * tools and node's own http server — the product only ever sees the URL.
 *
 * The URL's pathname ends in the archive extension (`/DetoxStub.app.zip`):
 * the server picks its unpacker by that extension, the same way a CI
 * artifact link would.
 */
import { execFile } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

export interface ServedAppArchive extends AsyncDisposable {
  /** `http://127.0.0.1:<port>/<name>.zip` — dial it from anywhere. */
  readonly url: string;
}

/**
 * Zips `appPath` (the bundle directory, kept as the archive's single root
 * entry) and serves it on a fresh loopback port. Dispose closes the server
 * and deletes the temp archive.
 */
export async function serveZippedAppExternally(
  appPath: string,
  signal?: AbortSignal,
): Promise<ServedAppArchive> {
  const dir = await mkdtemp(path.join(tmpdir(), 'detox-app-archive-'));
  const archiveName = `${path.basename(appPath)}.zip`;
  const archivePath = path.join(dir, archiveName);
  await run('ditto', ['-c', '-k', '--keepParent', appPath, archivePath], { signal });
  const { size } = await stat(archivePath);

  const server = createServer((req, res) => {
    if (req.url !== `/${archiveName}`) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Length': size });
    createReadStream(archivePath).pipe(res);
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (address === null || typeof address === 'string') {
    server.close();
    throw new Error('archive server did not report a port');
  }

  return {
    url: `http://127.0.0.1:${String(address.port)}/${archiveName}`,
    async [Symbol.asyncDispose]() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await rm(dir, { recursive: true, force: true });
    },
  };
}
