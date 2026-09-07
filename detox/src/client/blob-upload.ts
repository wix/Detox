/**
 * The client half of the blob lane: archive the `.app` bundle, hash the
 * archive, ask the server "do you have these bytes" (`HEAD`), upload them
 * once if not (`PUT`), and install by hash.
 *
 * AbortSignal-first applies with no exemption: the caller's signal reaches
 * the zip child process, the hash stream, and both HTTP requests. There are
 * no clocks anywhere in this file; the caller's signal is the client's only
 * exit.
 *
 * The archive recipe is `zip -rX` from the bundle's parent directory, not
 * `ditto`: ditto embeds each file's atime in the zip's UX extra field, and
 * merely reading the tree (a previous archive pass, Spotlight) moves the
 * atime, so an unchanged build would re-hash differently. `-X` omits those
 * unix extra fields, so only a rebuild changes the hash.
 */
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';

import { BlobLaneClient } from '@detox-remote/core';
import { AbortError, DetoxError, DetoxErrorCode } from './errors';

// The dialing class lives in `@detox-remote/core`: the relay reuses the
// same implementation. Re-exported so this module's surface doesn't move.
export { BlobLaneClient } from '@detox-remote/core';
export type { BlobPutOptions, BlobLaneAddress } from '@detox-remote/core';

const run = promisify(execFile);

export interface PreparedAppBlob {
  /** Lowercase hex sha-256 of the archive — the blob's name everywhere. */
  readonly hex: string;
  /** The zipped bundle, ready to stream to the server. */
  readonly archivePath: string;
  readonly bytes: number;
  /** Deletes the temp archive. Never throws. */
  dispose(): Promise<void>;
}

function invalidAppPath(appPath: string, reason: string): DetoxError {
  return new DetoxError(
    `installApp needs the path of a .app bundle directory — ${appPath} ${reason}. ` +
      '(An archive file is not supported here: unpack it, or serve it over http(s) and pass the URL.)',
    {
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { method: 'installApp', appPath, reason },
    },
  );
}

/**
 * Archives the bundle and hashes the archive. The path must name a `.app`
 * bundle directory — what `simctl install` takes and what every fixture
 * builds; anything else dies here, client-side, before a byte moves.
 */
export async function archiveAppBundle(
  appPath: string,
  options: { signal?: AbortSignal } = {},
): Promise<PreparedAppBlob> {
  const { signal } = options;
  // @issue DTX-3001: a pre-aborted signal wins over path validation.
  if (signal?.aborted) throw new AbortError(signal.reason);
  if (!appPath.endsWith('.app')) {
    throw invalidAppPath(appPath, 'does not end in .app');
  }
  let info;
  try {
    info = await stat(appPath);
  } catch {
    throw invalidAppPath(appPath, 'does not exist');
  }
  if (!info.isDirectory()) {
    throw invalidAppPath(appPath, 'is not a directory');
  }

  const dir = await mkdtemp(path.join(tmpdir(), 'detox-app-upload-'));
  const dispose = async (): Promise<void> => {
    try {
      await rm(dir, { recursive: true, force: true });
    } catch {
      // Best-effort: a leaked temp archive must never fail the install.
    }
  };
  try {
    const archivePath = path.join(dir, 'app.zip');
    try {
      // From the bundle's parent, naming only the bundle: entries are
      // `Foo.app/…` (the shape the server's unpack half expects), and the
      // temp directory's random name never leaks into the bytes.
      await run('zip', ['-r', '-X', '-q', archivePath, path.basename(appPath)], {
        cwd: path.dirname(appPath),
        signal,
      });
    } catch (err) {
      if (signal?.aborted) throw new AbortError(signal.reason);
      throw new DetoxError(`installApp could not archive ${appPath} (zip)`, {
        code: DetoxErrorCode.DETOX_APP_TRANSFER_FAILED,
        details: { method: 'installApp', appPath },
        cause: err,
      });
    }

    const hash = createHash('sha256');
    let bytes = 0;
    for await (const chunk of createReadStream(archivePath)) {
      signal?.throwIfAborted();
      hash.update(chunk as Buffer);
      bytes += (chunk as Buffer).byteLength;
    }
    return { hex: hash.digest('hex'), archivePath, bytes, dispose };
  } catch (err) {
    await dispose();
    if (signal?.aborted && !(err instanceof AbortError)) throw new AbortError(signal.reason);
    throw err;
  }
}

function uploadFailed(hex: string, reason: string, cause?: unknown): DetoxError {
  return new DetoxError(`installApp could not upload the build (sha256/${hex}) — ${reason}`, {
    code: DetoxErrorCode.DETOX_APP_TRANSFER_FAILED,
    details: { method: 'installApp', blob: `sha256/${hex}`, reason },
    cause,
  });
}

/**
 * "Do you have these bytes" → upload once if not. Content addressing is the
 * whole dedup story: a returning build is one `HEAD`, never a transfer.
 */
export async function ensureBlobUploaded(
  lane: BlobLaneClient,
  blob: PreparedAppBlob,
  options: { signal?: AbortSignal; narrate?: (message: string) => void } = {},
): Promise<void> {
  const { signal, narrate } = options;
  let headStatus: number;
  try {
    headStatus = await lane.head(blob.hex, signal);
  } catch (err) {
    if (err instanceof AbortError) throw err;
    throw uploadFailed(blob.hex, 'the server could not be reached over the blob lane', err);
  }
  if (headStatus === 200) {
    narrate?.('Build already on the server (content-hash hit) — skipping upload');
    return;
  }
  if (headStatus !== 404) {
    throw uploadFailed(blob.hex, `the server answered HTTP ${String(headStatus)} to the presence check`);
  }

  const totalMb = Math.ceil(blob.bytes / (1024 * 1024));
  narrate?.(`Uploading the build (${String(totalMb)} MB)`);
  // Progress narration is derived from bytes sent, not a timer.
  let sent = 0;
  let nextMark = 0.25;
  const onBytes = (chunkBytes: number): void => {
    sent += chunkBytes;
    while (blob.bytes > 0 && sent >= blob.bytes * nextMark && nextMark < 1) {
      narrate?.(`Uploading the build — ${String(Math.round(nextMark * 100))}% of ${String(totalMb)} MB`);
      nextMark += 0.25;
    }
  };
  let putStatus: number;
  try {
    putStatus = await lane.put(blob.hex, {
      archivePath: blob.archivePath,
      bytes: blob.bytes,
      signal,
      onBytes,
    });
  } catch (err) {
    if (err instanceof AbortError) throw err;
    throw uploadFailed(blob.hex, 'the upload broke mid-stream', err);
  }
  if (putStatus !== 201 && putStatus !== 200) {
    throw uploadFailed(blob.hex, `the server refused the upload (HTTP ${String(putStatus)})`);
  }
}
