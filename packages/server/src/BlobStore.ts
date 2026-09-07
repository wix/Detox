/**
 * The content-addressed blob store (spec 007).
 *
 * One root, fixed per user, shared across every server life. The store
 * survives restart: bytes under a content hash are not a device belief (no
 * device ownership survives a restart, but content-addressed bytes may), and
 * burning them would force every restart to re-upload every build on the farm.
 *
 * Store discipline:
 * - a blob has no owner and no TTL — content addressing exists to make
 *   "will this client come back" unnecessary;
 * - pinned while an in-flight install reads it (refcount), and only then —
 *   a session-lifetime pin would let one long CI session defeat the budget;
 * - eviction by byte budget only, LRU on last use (a `HEAD` hit or an
 *   install start), never upload date, never a clock; triggered at admission
 *   plus one sweep at startup;
 * - the startup sweep deletes temp-file debris of crashed PUTs and nothing
 *   else — an entry's name is self-validating, so the root reconstructs from
 *   its own filenames.
 *
 * "Admission" is the rename into the store, not the declaration: bytes
 * stream to a temp file first, and room is made only once the digest has
 * proven them. Making room against a declared Content-Length alone would
 * let a client declare a budget-sized length and then stall, evicting the
 * whole store on a promise and holding the freed room hostage for the life
 * of its socket. The declared length still fences what it honestly can up
 * front: 411 (no length) and 413 (can never fit) are answered before a byte
 * is read.
 *
 * Crash safety: a PUT streams to a temp file in the store's own root (same
 * filesystem → atomic rename), the digest is computed en route, and the
 * entry is renamed into place only on a match.
 * @issue DTX-6205: the store can never hold bytes whose name lies, and a
 * dead uploader's debris never blocks an honest retry.
 * @issue DTX-6206: temp files live per-PID; the startup sweep clears only
 * dirs whose owning process is dead.
 *
 * @issue DTX-6207: the table is bookkeeping, not ground truth — an entry
 * whose file vanished behind our back is dropped the moment `pin`/`put`
 * catch it lying, so a phantom self-heals through the client's re-upload
 * round instead of poisoning the hash forever.
 *
 * The store is content-blind at admission: whether the bytes are an
 * installable archive is judged at install time, never at PUT time.
 */
import { createHash, randomBytes } from 'node:crypto';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, readdir, rename, rm, stat, utimes } from 'node:fs/promises';
import { homedir } from 'node:os';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { serverLog } from './log-sink';

/**
 * The fixed per-user store location (not configurable — the operator
 * surface is exactly one knob, the byte budget). The blob-root @internal
 * seam overrides it for accept runs, so they never share a store with the
 * machine's real server.
 */
export const DEFAULT_BLOB_ROOT = path.join(homedir(), 'Library', 'Caches', 'detox-server', 'blobs');

/**
 * Default `--blob-budget`. Sized for a build cache, not an archive: real
 * zipped .app bundles run tens to hundreds of megabytes, so this holds a few
 * dozen distinct builds before LRU starts working. An operator with a busier
 * farm raises the one knob.
 */
export const DEFAULT_BLOB_BUDGET_BYTES = 8 * 1024 * 1024 * 1024;

/** The one digest spelling of the lane; the URL form and `blob.hex` share it. */
export const SHA256_HEX_RE = /^[0-9a-f]{64}$/;

/**
 * A refusal the HTTP lane translates 1:1 into a response status. Statuses are
 * the whole wire contract (response bodies are unspecified), so the store
 * speaks them directly rather than inventing a parallel error vocabulary:
 * 400 = the bytes lied (digest or declared length), 413 = a single blob
 * larger than the whole budget (it can never be admitted), 507 = room cannot
 * be made — everything evictable is pinned by in-flight installs.
 */
export class BlobRefusal extends Error {
  constructor(
    readonly status: 400 | 413 | 507,
    message: string,
  ) {
    super(message);
    this.name = 'BlobRefusal';
  }
}

interface BlobEntry {
  bytes: number;
  /** Monotonic use order — LRU without a clock. */
  lastUse: number;
  /** In-flight installs reading this entry right now; never evict above 0. */
  pins: number;
}

export interface BlobStoreOptions {
  root?: string;
  budgetBytes?: number;
  /**
   * Who is talking, for the store's log lines — `[server]` by default, the
   * relay passes `[relay]` (spec 008: a relay must not talk like a server;
   * its operator and the accept helpers key on the prefix).
   */
  logPrefix?: string;
}

export class BlobStore {
  readonly #root: string;
  readonly #budgetBytes: number;
  readonly #logPrefix: string;
  readonly #entries = new Map<string, BlobEntry>();
  #usedBytes = 0;
  #useSeq = 0;

  private constructor(options: Required<BlobStoreOptions>) {
    this.#root = options.root;
    this.#budgetBytes = options.budgetBytes;
    this.#logPrefix = options.logPrefix;
  }

  /**
   * Opens (and if needed creates) the store: sweeps tmp debris of dead
   * processes' crashed PUTs, then reconstructs the entry table from the
   * self-validating filenames under `sha256/`. Initial LRU order comes from
   * file mtimes; `touch` writes mtimes back on every use, so across a
   * restart the order really is last use, not upload date.
   */
  static async open(options: BlobStoreOptions = {}): Promise<BlobStore> {
    const root = options.root ?? DEFAULT_BLOB_ROOT;
    const budgetBytes = options.budgetBytes ?? DEFAULT_BLOB_BUDGET_BYTES;
    if (!Number.isFinite(budgetBytes) || budgetBytes <= 0) {
      throw new Error(`blob store budget must be a positive number of bytes (got ${String(budgetBytes)})`);
    }
    const store = new BlobStore({ root, budgetBytes, logPrefix: options.logPrefix ?? '[server]' });
    await mkdir(store.#entriesDir(), { recursive: true });
    await mkdir(store.#tmpRoot(), { recursive: true });

    // @issue DTX-6206: crashed PUTs' temp debris only — per-PID dirs let the
    // sweep tell a dead owner's debris from a live sibling server's
    // in-flight uploads, and it never touches the latter.
    for (const name of await readdir(store.#tmpRoot())) {
      const pid = Number(name);
      if (Number.isInteger(pid) && pid > 0 && isProcessAlive(pid) && pid !== process.pid) continue;
      await rm(path.join(store.#tmpRoot(), name), { recursive: true, force: true });
    }
    await mkdir(store.#tmpDir(), { recursive: true });

    const found: { hex: string; bytes: number; mtimeMs: number }[] = [];
    for (const name of await readdir(store.#entriesDir())) {
      if (!SHA256_HEX_RE.test(name)) continue; // not ours to judge — the sweep deletes debris only
      const info = await stat(path.join(store.#entriesDir(), name));
      if (!info.isFile()) continue;
      found.push({ hex: name, bytes: info.size, mtimeMs: info.mtimeMs });
    }
    found.sort((a, b) => a.mtimeMs - b.mtimeMs);
    for (const entry of found) {
      store.#entries.set(entry.hex, { bytes: entry.bytes, lastUse: ++store.#useSeq, pins: 0 });
      store.#usedBytes += entry.bytes;
    }
    return store;
  }

  get budgetBytes(): number {
    return this.#budgetBytes;
  }

  /** Bytes of every stored entry. */
  get usedBytes(): number {
    return this.#usedBytes;
  }

  has(hex: string): boolean {
    return this.#entries.has(hex);
  }

  /**
   * @issue DTX-6208: a use for LRU purposes — a `HEAD` hit or an install
   * start. Written back to the file's mtime, fire-and-forget, so the LRU
   * order survives a restart as genuine last-use order.
   */
  touch(hex: string): void {
    const entry = this.#entries.get(hex);
    if (!entry) return;
    entry.lastUse = ++this.#useSeq;
    const now = new Date();
    void utimes(this.pathOf(hex), now, now).catch(() => undefined);
  }

  /** Where an entry's bytes live. The entry is immutable — never install from it in place. */
  pathOf(hex: string): string {
    return path.join(this.#entriesDir(), hex);
  }

  /**
   * Pins the entry against eviction while an install reads it. Returns false
   * if the blob is absent — the caller's typed "re-upload and retry" answer,
   * never an exception, because absence is an expected race (an eviction
   * beat the install), not a fault.
   *
   * @issue DTX-6207: existence is re-verified against the filesystem, not
   * just the table, so a phantom entry is dropped and self-heals here too.
   */
  pin(hex: string): boolean {
    const entry = this.#entries.get(hex);
    if (!entry) return false;
    if (!existsSync(this.pathOf(hex))) {
      this.#forget(hex);
      return false;
    }
    entry.pins += 1;
    return true;
  }

  unpin(hex: string): void {
    const entry = this.#entries.get(hex);
    if (entry && entry.pins > 0) entry.pins -= 1;
  }

  /**
   * Admits and stores one upload: fences what the declaration can honestly
   * answer (413 — can never fit), streams to a per-PID temp file hashing en
   * route, then makes room and renames into place only if the digest
   * matches the name. Room is made against verified bytes, never the
   * declaration (see the header).
   *
   * @issue DTX-6209: returns 'already-present' without reading the body when
   * the entry's file is really there — a returning build is a hash check,
   * not a transfer. Throws {@link BlobRefusal} for everything the wire
   * answers with a status; anything else (the uploader died mid-body,
   * filesystem trouble) propagates raw after the temp file is gone.
   */
  async put(
    hex: string,
    body: AsyncIterable<Uint8Array>,
    declaredBytes: number,
  ): Promise<'stored' | 'already-present'> {
    if (this.#entries.has(hex)) {
      if (existsSync(this.pathOf(hex))) {
        this.touch(hex); // an idempotent re-PUT is a use, same as a HEAD hit
        return 'already-present';
      }
      this.#forget(hex); // the table was stale — accept the re-upload below
    }
    if (!Number.isInteger(declaredBytes) || declaredBytes < 0) {
      throw new BlobRefusal(400, `Content-Length is not a byte count: ${String(declaredBytes)}`);
    }
    if (declaredBytes > this.#budgetBytes) {
      throw new BlobRefusal(
        413,
        `a ${String(declaredBytes)}-byte blob can never fit the ${String(this.#budgetBytes)}-byte budget`,
      );
    }

    const tempPath = path.join(this.#tmpDir(), `${hex}.${randomBytes(6).toString('hex')}`);
    const hash = createHash('sha256');
    let received = 0;
    async function* hashed(): AsyncGenerator<Uint8Array> {
      for await (const chunk of body) {
        hash.update(chunk);
        received += chunk.byteLength;
        yield chunk;
      }
    }
    try {
      await pipeline(Readable.from(hashed()), createWriteStream(tempPath));
    } catch (err) {
      await rm(tempPath, { force: true });
      throw err; // the uploader died — nothing stored, nothing to answer
    }
    if (received !== declaredBytes) {
      await rm(tempPath, { force: true });
      throw new BlobRefusal(400, `declared ${String(declaredBytes)} bytes, sent ${String(received)}`);
    }
    const digest = hash.digest('hex');
    if (digest !== hex) {
      await rm(tempPath, { force: true });
      throw new BlobRefusal(400, `the bytes hash to sha256/${digest}, not the name they were sent under`);
    }

    // @issue DTX-6210: a concurrent PUT of the same hex may win first — keep
    // its entry rather than overwrite with pins: 0, or eviction could delete
    // the file out from under a live install.
    if (this.#entries.has(hex) && existsSync(this.pathOf(hex))) {
      await rm(tempPath, { force: true });
      this.touch(hex);
      return 'already-present';
    }

    try {
      await this.#makeRoom(hex, received);
    } catch (err) {
      await rm(tempPath, { force: true });
      throw err;
    }
    await rename(tempPath, this.pathOf(hex));
    this.#entries.set(hex, { bytes: received, lastUse: ++this.#useSeq, pins: 0 });
    this.#usedBytes += received;
    // The freshly-stored line is an accept-suite instrument (spec 007 pins
    // its count through the editable `countBlobStores`); rephrase only
    // together with that helper.
    serverLog.info(`${this.#logPrefix} blob stored — sha256/${hex} (${String(received)} bytes)`, { hex, bytes: received });
    return 'stored';
  }

  /**
   * Byte-budget eviction at admission: LRU on last use, unpinned entries
   * only, one victim at a time until the newcomer fits. The victim's file is
   * awaited gone before returning — a fire-and-forget unlink could outrun a
   * re-PUT of the same hex and delete the fresh bytes under a live entry.
   */
  async #makeRoom(hex: string, bytes: number): Promise<void> {
    while (this.#usedBytes + bytes > this.#budgetBytes) {
      let victim: { hex: string; entry: BlobEntry } | undefined;
      for (const [candidateHex, entry] of this.#entries) {
        if (entry.pins > 0) continue;
        if (!victim || entry.lastUse < victim.entry.lastUse) victim = { hex: candidateHex, entry };
      }
      if (!victim) {
        throw new BlobRefusal(
          507,
          'no room can be made — every stored blob is pinned by an in-flight install',
        );
      }
      this.#forget(victim.hex);
      serverLog.info(
        `${this.#logPrefix} blob evicted — sha256/${victim.hex} (${String(victim.entry.bytes)} bytes, making room for sha256/${hex})`,
      );
      await deleteQuietly(this.pathOf(victim.hex));
    }
  }

  /** Drops an entry from the table (bookkeeping only — the file is the caller's story). */
  #forget(hex: string): void {
    const entry = this.#entries.get(hex);
    if (!entry) return;
    this.#entries.delete(hex);
    this.#usedBytes -= entry.bytes;
  }

  #entriesDir(): string {
    return path.join(this.#root, 'sha256');
  }

  #tmpRoot(): string {
    return path.join(this.#root, 'tmp');
  }

  #tmpDir(): string {
    return path.join(this.#tmpRoot(), String(process.pid));
  }
}

/** Whether a pid names a live process — `kill(pid, 0)` probes without touching. */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM means "alive, not ours" — still alive. Only ESRCH means gone.
    return (err as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/**
 * @issue DTX-6211: best-effort deletion for evicted entry files — by the
 * time it runs, the store's bookkeeping is already consistent, so a refusal
 * costs disk, never correctness. @internal — exported for its own unit test
 * only.
 */
export async function deleteQuietly(filePath: string): Promise<void> {
  try {
    await rm(filePath, { force: true });
  } catch {
    // no-op
  }
}
