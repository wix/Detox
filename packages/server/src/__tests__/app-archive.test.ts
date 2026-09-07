/**
 * `fetchAndUnpackApp` (spec 003): real fs, a real
 * loopback HTTP server, the real `ditto`/`tar` children — nothing mocked,
 * because the failure modes under test (bad archive, wrong count of .app
 * bundles, broken transfer) are exactly the ones mocks fake away.
 */
import { execFile } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import { DetoxError, DetoxErrorCode } from '@detox-remote/core';
import { isHttpUrl } from '@detox-remote/protocol';

import { fetchAndUnpackApp } from '../app-archive';

const run = promisify(execFile);

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (cleanups.length > 0) await cleanups.pop()?.();
});

async function scratchDir(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'app-archive-test-'));
  cleanups.push(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

/** A minimal fake bundle: a directory named `*.app` with one marker file. */
async function makeApp(parent: string, name = 'Fake.app'): Promise<string> {
  const appPath = path.join(parent, name);
  await mkdir(appPath, { recursive: true });
  await writeFile(path.join(appPath, 'marker.txt'), 'fake-app');
  return appPath;
}

/** Serves the files of `dir` on a fresh loopback port; returns the base URL. */
async function serve(dir: string): Promise<string> {
  const server: Server = createServer((req, res) => {
    if (req.url === '/broken.zip') {
      // Promise 1 KiB, stream a few bytes, then kill the socket a tick later —
      // so `fetch` resolves and the death lands mid-stream (the pipeline arm),
      // not on the initial connect.
      res.writeHead(200, { 'Content-Length': 1024 });
      res.write('PK partial');
      setTimeout(() => res.destroy(), 40);
      return;
    }
    if (req.url === '/hang.zip') {
      // Accept the connection and never answer: the headers-phase stall.
      return;
    }
    const filePath = path.join(dir, req.url?.slice(1) ?? '');
    void stat(filePath).then(
      (s) => {
        res.writeHead(200, { 'Content-Length': s.size });
        createReadStream(filePath).pipe(res);
      },
      () => res.writeHead(404).end(),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  cleanups.push(() => new Promise((resolve) => server.close(() => resolve())));
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('no port');
  return `http://127.0.0.1:${String(address.port)}`;
}

function detoxCodeOf(err: unknown): number | undefined {
  return err instanceof DetoxError ? err.code : undefined;
}

/** Leftover temp dirs are the cleanup contract's failure signal. */
async function installTempDirs(): Promise<string[]> {
  const entries = await readdir(tmpdir());
  return entries.filter((name) => name.startsWith('detox-install-url-'));
}

describe('isHttpUrl (the protocol predicate both sides split on)', () => {
  it('says yes to http/https in any case, no to paths and other schemes', () => {
    expect(isHttpUrl('https://x.example/a.zip')).toBe(true);
    expect(isHttpUrl('HTTP://x.example/a.zip')).toBe(true);
    expect(isHttpUrl('/tmp/App.app')).toBe(false);
    expect(isHttpUrl('relative/App.app')).toBe(false);
    expect(isHttpUrl('file:///tmp/App.app')).toBe(false);
    expect(isHttpUrl('ftp://x.example/a.zip')).toBe(false);
  });
});

describe('fetchAndUnpackApp', () => {
  /**
   * @issue DTX-6100
   * Every download is a fresh temp dir, deleted on every ending, including
   * abort (cancellation cleans up after itself). No test in
   * this block may leak a `detox-install-url-*` directory, whatever its
   * ending.
   */
  afterAll(async () => {
    expect(await installTempDirs()).toEqual([]);
  });

  it.skipIf(process.platform !== 'darwin')(
    'zip: downloads, unpacks, finds the bundle; dispose removes the tree',
    async () => {
    const dir = await scratchDir();
    const appPath = await makeApp(dir);
    await run('ditto', ['-c', '-k', '--keepParent', appPath, path.join(dir, 'app.zip')]);
    const base = await serve(dir);

    const fetched = await fetchAndUnpackApp(`${base}/app.zip`);
    expect(path.basename(fetched.appPath)).toBe('Fake.app');
    await expect(stat(path.join(fetched.appPath, 'marker.txt'))).resolves.toBeTruthy();

    await fetched.dispose();
    await expect(stat(fetched.appPath)).rejects.toThrow();
    },
  );

  /**
   * @issue DTX-6102
   * `findAppBundle` searches two levels deep, so an archive that wraps its
   * payload in one folder (`payload/Wrapped.app`) still resolves.
   */
  it('tgz: bsdtar unpacks the tarball family; a one-folder wrapper is looked through', async () => {
    const dir = await scratchDir();
    const wrapper = path.join(dir, 'payload');
    await makeApp(wrapper, 'Wrapped.app');
    await run('tar', ['-czf', path.join(dir, 'app.tgz'), '-C', dir, 'payload']);
    const base = await serve(dir);

    const fetched = await fetchAndUnpackApp(`${base}/app.tgz`);
    expect(path.basename(fetched.appPath)).toBe('Wrapped.app');
    await fetched.dispose();
  });

  it('an extension nobody can unpack is the CALLER\'s mistake — DETOX_INVALID_ARGUMENT', async () => {
    const err = await fetchAndUnpackApp('https://x.example/app.rar').catch((e: unknown) => e);
    expect(detoxCodeOf(err)).toBe(DetoxErrorCode.DETOX_INVALID_ARGUMENT);
  });

  it('an HTTP error status is a transfer failure — DETOX_APP_TRANSFER_FAILED', async () => {
    const base = await serve(await scratchDir());
    const err = await fetchAndUnpackApp(`${base}/missing.zip`).catch((e: unknown) => e);
    expect(detoxCodeOf(err)).toBe(DetoxErrorCode.DETOX_APP_TRANSFER_FAILED);
  });

  it('an unreachable server is a transfer failure, with the cause preserved', async () => {
    const err = await fetchAndUnpackApp('http://127.0.0.1:9/app.zip').catch((e: unknown) => e);
    expect(detoxCodeOf(err)).toBe(DetoxErrorCode.DETOX_APP_TRANSFER_FAILED);
    expect((err as DetoxError).cause).toBeTruthy();
  });

  it.skipIf(process.platform !== 'darwin')(
    'the size cap kills an oversized download typed, not the disk',
    async () => {
    const dir = await scratchDir();
    const appPath = await makeApp(dir);
    await run('ditto', ['-c', '-k', '--keepParent', appPath, path.join(dir, 'app.zip')]);
    const base = await serve(dir);

    const err = await fetchAndUnpackApp(`${base}/app.zip`, { maxBytes: 16 }).catch(
      (e: unknown) => e,
    );
    expect(detoxCodeOf(err)).toBe(DetoxErrorCode.DETOX_APP_TRANSFER_FAILED);
    expect(String((err as DetoxError).message)).toContain('cap');
    },
  );

  /**
   * @issue DTX-6106
   * The stall timeout fires near `stallMs`, not some larger total budget —
   * a transfer that keeps making progress is never killed regardless of
   * total elapsed time.
   */
  it('a host that hangs fails FAST via the stall timeout — the only clock a download keeps', async () => {
    const base = await serve(await scratchDir());
    const started = Date.now();
    const err = await fetchAndUnpackApp(`${base}/hang.zip`, { stallMs: 150 }).catch(
      (e: unknown) => e,
    );
    expect(detoxCodeOf(err)).toBe(DetoxErrorCode.DETOX_APP_TRANSFER_FAILED);
    expect(String((err as DetoxError).message)).toContain('no data');
    expect(Date.now() - started).toBeLessThan(5000);
  });

  it('a download that dies mid-stream is a transfer failure', async () => {
    const base = await serve(await scratchDir());
    const err = await fetchAndUnpackApp(`${base}/broken.zip`).catch((e: unknown) => e);
    expect(detoxCodeOf(err)).toBe(DetoxErrorCode.DETOX_APP_TRANSFER_FAILED);
    expect(String((err as DetoxError).message)).toContain('mid-stream');
  });

  /**
   * @issue DTX-6101
   * `isHttpUrl` is a regex that admits strings `new URL()` cannot parse
   * (`https://` with no host, a stray space) — that mismatch is the
   * caller's mistake, not an unclassified failure.
   */
  it('a string URL cannot parse is the CALLER\'s mistake — DETOX_INVALID_ARGUMENT, not unclassified', async () => {
    for (const bad of ['https://', 'http://[oops', 'https://ci.example.com/App zip']) {
      const err = await fetchAndUnpackApp(bad).catch((e: unknown) => e);
      expect(detoxCodeOf(err)).toBe(DetoxErrorCode.DETOX_INVALID_ARGUMENT);
    }
  });

  it('link-local / metadata hosts are refused before any fetch — DETOX_INVALID_ARGUMENT', async () => {
    for (const host of ['169.254.169.254', '169.254.1.2', '[fe80::1]']) {
      const err = await fetchAndUnpackApp(`http://${host}/App.zip`).catch((e: unknown) => e);
      expect(detoxCodeOf(err)).toBe(DetoxErrorCode.DETOX_INVALID_ARGUMENT);
      expect(String((err as DetoxError).message)).toContain('metadata');
    }
  });

  it('credentials and query never reach the error payload (redaction)', async () => {
    const err = (await fetchAndUnpackApp(
      'http://user:s3cr3t@127.0.0.1:9/App.zip?sig=deadbeef',
    ).catch((e: unknown) => e)) as DetoxError;
    const serialized = JSON.stringify({ message: err.message, details: err.details });
    expect(serialized).not.toContain('s3cr3t');
    expect(serialized).not.toContain('deadbeef');
  });

  /**
   * @issue DTX-6105
   * `MAX_ARCHIVE_BYTES` is enforced on both the wire bytes and the
   * unpacked tree: a small archive can decompress into a disk-filling
   * bomb (~1000:1 with deflate), so the wire cap alone is not enough.
   */
  it.skipIf(process.platform !== 'darwin')(
    'a decompression bomb is caught by the unpacked-size cap, not just the wire cap',
    async () => {
    const dir = await scratchDir();
    const wrapper = path.join(dir, 'bomb');
    const app = await makeApp(wrapper, 'Bomb.app');
    // ~2 MiB of zeros compresses tiny; cap the unpacked size below it.
    await writeFile(path.join(app, 'payload.bin'), Buffer.alloc(2 * 1024 * 1024, 0));
    await run('ditto', ['-c', '-k', '--keepParent', wrapper, path.join(dir, 'app.zip')]);
    const base = await serve(dir);

    const err = await fetchAndUnpackApp(`${base}/app.zip`, { maxBytes: 64 * 1024 }).catch(
      (e: unknown) => e,
    );
    expect(detoxCodeOf(err)).toBe(DetoxErrorCode.DETOX_APP_TRANSFER_FAILED);
    expect(String((err as DetoxError).message)).toContain('unpacked');
    },
  );

  it.skipIf(process.platform !== 'darwin')(
    'a zip carrying a ../ traversal member escapes nothing — the sentinel is never written',
    async () => {
    // A genuinely hostile archive (a real `../` member): ditto sanitizes the
    // member into the destination, the sentinel path outside it must not
    // exist, and the install must still resolve to the bundle in the tree.
    const dir = await scratchDir();
    const sentinel = path.join(dir, 'ESCAPED_SENTINEL.txt');
    const zipPath = path.join(dir, 'app.zip');
    // python3's zipfile writes arbitrary member names verbatim — including
    // `..` — which the archiver CLIs refuse to author.
    await run('python3', [
      '-c',
      [
        'import zipfile,sys',
        'z=zipfile.ZipFile(sys.argv[1],"w")',
        'z.writestr("Good.app/marker.txt","ok")',
        'z.writestr("../ESCAPED_SENTINEL.txt","pwned")',
        'z.close()',
      ].join('\n'),
      zipPath,
    ]);
    const base = await serve(dir);

    const fetched = await fetchAndUnpackApp(`${base}/app.zip`);
    expect(path.basename(fetched.appPath)).toBe('Good.app');
    await expect(stat(sentinel)).rejects.toThrow(); // nothing escaped the temp tree
    await fetched.dispose();
    },
  );

  it('bytes that are not an archive fail in the unpacker, typed', async () => {
    const dir = await scratchDir();
    await writeFile(path.join(dir, 'garbage.zip'), 'this is not a zip');
    const base = await serve(dir);
    const err = await fetchAndUnpackApp(`${base}/garbage.zip`).catch((e: unknown) => e);
    expect(detoxCodeOf(err)).toBe(DetoxErrorCode.DETOX_APP_TRANSFER_FAILED);
    expect(String((err as DetoxError).message)).toContain('would not unpack');
  });

  it.skipIf(process.platform !== 'darwin')(
    'a valid archive holding no .app bundle dies typed',
    async () => {
    const dir = await scratchDir();
    const stray = path.join(dir, 'not-an-app');
    await mkdir(stray);
    await writeFile(path.join(stray, 'file.txt'), 'x');
    await run('ditto', ['-c', '-k', '--keepParent', stray, path.join(dir, 'app.zip')]);
    const base = await serve(dir);

    const err = await fetchAndUnpackApp(`${base}/app.zip`).catch((e: unknown) => e);
    expect(detoxCodeOf(err)).toBe(DetoxErrorCode.DETOX_APP_TRANSFER_FAILED);
    expect(String((err as DetoxError).message)).toContain('no .app');
    },
  );

  /**
   * @issue DTX-6103
   * `findAppBundle` treats zero `.app` bundles as a broken archive and two
   * as an ambiguity — both die typed rather than guessing which bundle was
   * meant.
   */
  it.skipIf(process.platform !== 'darwin')(
    'two .app bundles are an ambiguity, never a guess',
    async () => {
    const dir = await scratchDir();
    const wrapper = path.join(dir, 'both');
    await makeApp(wrapper, 'One.app');
    await makeApp(wrapper, 'Two.app');
    await run('ditto', ['-c', '-k', '--keepParent', wrapper, path.join(dir, 'app.zip')]);
    const base = await serve(dir);

    const err = await fetchAndUnpackApp(`${base}/app.zip`).catch((e: unknown) => e);
    expect(detoxCodeOf(err)).toBe(DetoxErrorCode.DETOX_APP_TRANSFER_FAILED);
    expect(String((err as DetoxError).message)).toContain('2 .app bundles');
    },
  );

  it.skipIf(process.platform !== 'darwin')(
    'an abort stays an abort — never reclassified as a transfer failure',
    async () => {
    const dir = await scratchDir();
    const appPath = await makeApp(dir);
    await run('ditto', ['-c', '-k', '--keepParent', appPath, path.join(dir, 'app.zip')]);
    const base = await serve(dir);

    const reason = new Error('caller changed their mind');
    const controller = new AbortController();
    controller.abort(reason);
    const err = await fetchAndUnpackApp(`${base}/app.zip`, { signal: controller.signal }).catch(
      (e: unknown) => e,
    );
    // A caller abort is a typed DETOX_ABORTED carrying the caller's own
    // reason — never a DETOX_APP_TRANSFER_FAILED, and never untyped.
    expect(detoxCodeOf(err)).toBe(DetoxErrorCode.DETOX_ABORTED);
    expect((err as DetoxError).cause).toBe(reason);
    },
  );
});
