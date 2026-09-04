/**
 * The URL form of `installApp` (spec 003): fetch an app archive over
 * http(s), unpack it, hand back the single `.app` bundle inside for
 * `simctl install`.
 *
 * The server fetches an archive from an address on the client's own LAN,
 * so private ranges are allowed. Link-local and cloud-metadata hosts are
 * refused (no legitimate use in an app-transfer link). URLs are logged
 * without credentials.
 *
 * Not loopback-gated: a URL only spends the server's network position.
 *
 * Error split (registry: `packages/core/src/errors.ts`):
 * - the string is wrong (unparseable, scheme we do not speak, extension we
 *   cannot unpack, a forbidden host) → `DETOX_INVALID_ARGUMENT`;
 * - the transfer came apart (HTTP status, network, timeout, size cap, unpack
 *   failure, no single `.app` inside) → `DETOX_APP_TRANSFER_FAILED`;
 * - the caller's abort stays an abort — never reclassified.
 *
 * Caching (ETag revalidation), credentials, and integrity pinning are
 * unspecified here: the transfer-lane spec owns them.
 * @issue DTX-6100: every download is a fresh temp dir, deleted on every ending, including abort.
 */
import { createWriteStream } from 'node:fs';
import { mkdir, mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { AbortError, DetoxError, DetoxErrorCode } from '@detox-remote/core';

import { execWithRetries } from './exec';
import { redactUrl } from './redact';

// The path-vs-URL predicate lives in @detox-remote/protocol next to
// `InstallAppParams` — client and server must split on the same test.

/**
 * One bound for the whole family of local unpack children (`ditto`/`tar`
 * over an already-downloaded file) — generous next to the observed
 * sub-second reality, small next to the operation deadlines around it.
 */
const UNPACK_TIMEOUT_MS = 120_000;

/**
 * No-progress deadline, covering both the headers wait and mid-body: a wrong
 * host that merely hangs (unlike refusing, 404ing, or failing DNS, which are
 * already instant) surfaces in seconds instead of hanging indefinitely.
 * @issue DTX-6106: it fires near this deadline, not some larger total budget.
 * Re-arms on every chunk, so a large slow download is never penalized as
 * long as it keeps making progress.
 */
const STALL_TIMEOUT_MS = 30_000;

/**
 * Downloads larger than this die typed instead of filling the disk. Two
 * gigabytes clears every real .app archive by an order of magnitude while
 * still meaning something is wrong with that link.
 * @issue DTX-6105: enforced on both wire bytes and the unpacked tree (bomb ratio ~1000:1 with deflate).
 */
export const MAX_ARCHIVE_BYTES = 2 * 1024 * 1024 * 1024;

/** One unpack child, fully spelled: the executable and its argv. */
interface UnpackCommand {
  file: string;
  args: string[];
}

interface Unpacker {
  extensions: readonly string[];
  command: (archive: string, dest: string) => UnpackCommand;
}

/** The archive spellings the URL's pathname may end in, and their unpackers. */
const UNPACKERS: readonly Unpacker[] = [
  {
    extensions: ['.zip'],
    command: (archive, dest) => ({ file: 'ditto', args: ['-x', '-k', archive, dest] }),
  },
  {
    // bsdtar sniffs compression itself, so one spelling covers the family.
    extensions: ['.tar.gz', '.tgz', '.tar'],
    command: (archive, dest) => ({ file: 'tar', args: ['-xf', archive, '-C', dest] }),
  },
];

/** The one redaction rule lives in `redact.ts`; re-exported for the callers that learned it here. */
export { redactUrlForLog } from './redact';

function invalidArgument(shown: string, reason: string): DetoxError {
  return new DetoxError(`installApp cannot use ${shown} — ${reason}`, {
    code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
    details: { url: shown, reason },
  });
}

function transferFailed(shown: string, reason: string, cause?: unknown): DetoxError {
  return new DetoxError(`installApp could not fetch ${shown} — ${reason}`, {
    code: DetoxErrorCode.DETOX_APP_TRANSFER_FAILED,
    details: { url: shown, reason },
    cause,
  });
}

/** A well-formed http(s) URL, or a typed `DETOX_INVALID_ARGUMENT`. */
function parseInstallUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    // @issue DTX-6101: isHttpUrl admits strings `new URL()` cannot parse — that's the caller's mistake.
    throw invalidArgument(raw, 'it is not a well-formed URL');
  }
  if (isForbiddenHost(parsed.hostname)) {
    throw invalidArgument(
      redactUrl(parsed),
      'link-local / metadata hosts are refused (server-side request forgery)',
    );
  }
  return parsed;
}

/** Link-local and cloud-metadata literals: no legitimate use in an app-transfer link. DNS names and redirects are not resolved here. */
function isForbiddenHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  return (
    host === '169.254.169.254' || // AWS/GCP/Azure IMDS
    host.startsWith('169.254.') || // IPv4 link-local
    host.startsWith('fe80:') || // IPv6 link-local
    host === 'fd00:ec2::254' // IMDSv6
  );
}

/** Total size of a directory tree, one level of `.app` bundles deep. */
async function treeBytes(dir: string): Promise<number> {
  let total = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        total += (await stat(full)).size;
      }
    }
  }
  return total;
}

function matchUnpacker(pathname: string): Unpacker | undefined {
  const lower = pathname.toLowerCase();
  return UNPACKERS.find((u) => u.extensions.some((ext) => lower.endsWith(ext)));
}

/**
 * @issue DTX-6102: searched two levels deep, so one wrapping folder is looked through.
 * @issue DTX-6103: zero bundles is a broken archive, two is ambiguous — both die typed, never guessed.
 */
async function findAppBundle(root: string, url: string): Promise<string> {
  const found: string[] = [];
  const top = await readdir(root, { withFileTypes: true });
  for (const entry of top) {
    if (!entry.isDirectory()) continue;
    const entryPath = path.join(root, entry.name);
    if (entry.name.endsWith('.app')) {
      found.push(entryPath);
      continue;
    }
    const nested = await readdir(entryPath, { withFileTypes: true });
    for (const inner of nested) {
      if (inner.isDirectory() && inner.name.endsWith('.app')) {
        found.push(path.join(entryPath, inner.name));
      }
    }
  }
  if (found.length !== 1) {
    throw transferFailed(
      url,
      found.length === 0
        ? 'the archive holds no .app bundle'
        : `the archive holds ${String(found.length)} .app bundles — one is required`,
    );
  }
  return found[0];
}

export interface FetchedApp {
  /** The unpacked `.app` bundle, ready for `simctl install`. */
  readonly appPath: string;
  /** Deletes the download and the unpacked tree. Never throws. */
  dispose(): Promise<void>;
}

/**
 * The unpack half alone, for install-by-blob (spec 007): the archive already
 * sits on this machine's disk (a blob-store entry — immutable, never
 * installed from directly), so there is nothing to fetch, only unpack →
 * locate.
 * @issue DTX-6104: the store is content-blind at admission; non-archive bytes are judged here, typed `DETOX_APP_TRANSFER_FAILED`.
 *
 * Always `ditto -x -k`: the lane's client uploads a standard zip (`zip -rX`),
 * and bytes that are not that are simply not an installable blob.
 */
export async function unpackAppArchive(
  archivePath: string,
  options: { signal?: AbortSignal; maxBytes?: number; shown?: string } = {},
): Promise<FetchedApp> {
  const { signal, maxBytes = MAX_ARCHIVE_BYTES, shown = path.basename(archivePath) } = options;
  // Its own error builder, not `transferFailed`: that one says "could not
  // fetch" and files the label under `details.url` — nothing was fetched
  // here and a blob address is not a URL. Same code (2016).
  const unpackFailed = (reason: string, cause?: unknown): DetoxError =>
    new DetoxError(`installApp could not unpack ${shown} — ${reason}`, {
      code: DetoxErrorCode.DETOX_APP_TRANSFER_FAILED,
      details: { blob: shown, reason },
      cause,
    });
  const dir = await mkdtemp(path.join(tmpdir(), 'detox-install-blob-'));
  const dispose = async (): Promise<void> => {
    try {
      await rm(dir, { recursive: true, force: true });
    } catch {
      // Best-effort: a leaked temp dir must never fail the install itself.
    }
  };
  try {
    const dest = path.join(dir, 'unpacked');
    await mkdir(dest);
    try {
      await execWithRetries({ file: 'ditto', args: ['-x', '-k', archivePath, dest], signal, timeout: UNPACK_TIMEOUT_MS });
    } catch (err) {
      if (signal?.aborted) throw new AbortError(signal.reason);
      // `killed` = the wedge-detector timeout above fired — that is our
      // clock, not corrupt bytes, and the message must not accuse the blob.
      const timedOut = (err as { killed?: boolean } | null)?.killed === true;
      throw unpackFailed(
        timedOut
          ? `the unpack did not finish within ${String(UNPACK_TIMEOUT_MS)}ms (a loaded machine, not bad bytes)`
          : 'the stored bytes would not unpack as a zip archive (ditto)',
        err,
      );
    }
    if ((await treeBytes(dest)) > maxBytes) {
      throw unpackFailed(`the unpacked app exceeded the ${String(maxBytes)}-byte cap`);
    }
    const appPath = await findAppBundle(dest, shown);
    return { appPath, dispose };
  } catch (err) {
    await dispose();
    throw err;
  }
}

/**
 * Fetch → unpack → locate.
 * @issue DTX-6100: on any failure (including abort) the temp tree is already gone by the time the error reaches the caller.
 * On success the caller owns `dispose()` and runs it after `simctl install`
 * finishes.
 */
export async function fetchAndUnpackApp(
  url: string,
  options: { signal?: AbortSignal; maxBytes?: number; stallMs?: number } = {},
): Promise<FetchedApp> {
  const { signal, maxBytes = MAX_ARCHIVE_BYTES, stallMs = STALL_TIMEOUT_MS } = options;
  const parsed = parseInstallUrl(url);
  const shown = redactUrl(parsed);
  const unpacker = matchUnpacker(parsed.pathname);
  if (unpacker === undefined) {
    throw invalidArgument(
      shown,
      'the URL must end in one of: ' + UNPACKERS.flatMap((u) => u.extensions).join(', '),
    );
  }

  // Two ways the fetch can end early, merged into one signal: the caller's
  // own abort (stays an abort) and a no-progress deadline (`stall`) re-armed
  // on every byte. No total-time cap: progress rearms the stall window,
  // and MAX_ARCHIVE_BYTES bounds the size.
  const stall = new AbortController();
  let stallTimer: ReturnType<typeof setTimeout> | undefined;
  const armStall = (): void => {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => stall.abort(new Error('stalled')), stallMs);
    stallTimer.unref?.(); // never keep the process alive on this timer alone
  };
  const signals = signal ? [signal, stall.signal] : [stall.signal];
  const combined = AbortSignal.any(signals);
  const abortOrFail = (err: unknown, reason: string): Error => {
    if (signal?.aborted) return new AbortError(signal.reason);
    if (stall.signal.aborted) {
      return transferFailed(
        shown,
        `no data for ${String(Math.round(stallMs / 1000))}s — the URL may be unreachable or wrong`,
      );
    }
    return transferFailed(shown, reason, err);
  };

  const dir = await mkdtemp(path.join(tmpdir(), 'detox-install-url-'));
  const dispose = async (): Promise<void> => {
    try {
      await rm(dir, { recursive: true, force: true });
    } catch {
      // Best-effort: a leaked temp dir must never fail the install itself.
    }
  };
  try {
    let response: Response;
    try {
      armStall(); // covers the connect/headers phase — a host that never answers
      response = await fetch(parsed, { signal: combined, redirect: 'follow' });
    } catch (err) {
      throw abortOrFail(err, 'the download failed');
    }
    if (!response.ok) {
      throw transferFailed(shown, `the server answered HTTP ${String(response.status)}`);
    }
    if (response.body === null) {
      throw transferFailed(shown, 'the server sent no body');
    }

    const archivePath = path.join(dir, 'archive');
    const body = response.body;
    async function* guarded(): AsyncGenerator<Uint8Array> {
      let received = 0;
      for await (const chunk of body) {
        armStall(); // progress made — reset the no-progress deadline
        received += chunk.byteLength;
        if (received > maxBytes) {
          throw transferFailed(shown, `the download exceeded the ${String(maxBytes)}-byte cap`);
        }
        yield chunk;
      }
    }
    try {
      await pipeline(Readable.from(guarded()), createWriteStream(archivePath), { signal: combined });
    } catch (err) {
      if (err instanceof DetoxError) throw err; // the cap, already typed
      throw abortOrFail(err, 'the download broke mid-stream');
    }
    clearTimeout(stallTimer); // download complete — the stall clock is done

    const dest = path.join(dir, 'unpacked');
    await mkdir(dest); // `tar -C` requires an existing directory; `ditto` tolerates one
    const { file, args } = unpacker.command(archivePath, dest);
    try {
      await execWithRetries({ file, args, signal, timeout: UNPACK_TIMEOUT_MS });
    } catch (err) {
      if (signal?.aborted) throw new AbortError(signal.reason);
      throw transferFailed(shown, `the archive would not unpack (${file})`, err);
    }

    // @issue DTX-6105: unpacked-size check — same bomb protection as the wire cap.
    if ((await treeBytes(dest)) > maxBytes) {
      throw transferFailed(shown, `the unpacked app exceeded the ${String(maxBytes)}-byte cap`);
    }

    const appPath = await findAppBundle(dest, shown);
    return { appPath, dispose };
  } catch (err) {
    await dispose();
    throw err;
  } finally {
    clearTimeout(stallTimer); // covers the headers-phase throw, before the download try
  }
}
