/**
 * BlobStore semantics that the HTTP fence cannot reach: restart
 * reconstruction, the startup sweep, pinning vs eviction (507), and the
 * bookkeeping edges. The wire-visible behaviors (status vocabulary, digest
 * verification, crash safety, LRU under budget) are additionally gated end
 * to end in `blob-lane.integration.test.ts`.
 */
import { createHash, randomBytes } from 'node:crypto';
import { mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { Readable } from 'node:stream';

import { describe, it, expect } from 'vitest';

import { BlobStore, BlobRefusal, deleteQuietly } from '../BlobStore';

function hexOf(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function body(bytes: Buffer): AsyncIterable<Uint8Array> {
  return Readable.from([bytes]);
}

async function freshRoot(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'detox-blob-store-test-'));
}

async function putBytes(store: BlobStore, bytes: Buffer): Promise<string> {
  const hex = hexOf(bytes);
  expect(await store.put(hex, body(bytes), bytes.length)).toBe('stored');
  return hex;
}

/** Every FILE anywhere under the store's tmp tree (tmp/ holds per-PID dirs). */
async function tmpFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  const stack = [path.join(root, 'tmp')];
  while (stack.length > 0) {
    const dir = stack.pop() as string;
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) stack.push(path.join(dir, entry.name));
      else files.push(entry.name);
    }
  }
  return files;
}

describe('BlobStore — lifecycle and reconstruction', () => {
  it('survives a reopen: entries reconstruct from their self-validating filenames', async () => {
    const root = await freshRoot();
    const first = await BlobStore.open({ root });
    const bytes = randomBytes(2048);
    const hex = await putBytes(first, bytes);
    const otherBytes = randomBytes(1024);
    const otherHex = await putBytes(first, otherBytes);
    expect(first.usedBytes).toBe(3072);

    // A second life on the same root: the bytes are still known — no
    // journal, no index file, the name IS the record.
    const second = await BlobStore.open({ root });
    expect(second.has(hex)).toBe(true);
    expect(second.has(otherHex)).toBe(true);
    expect(second.usedBytes).toBe(3072);
    expect(existsSync(second.pathOf(hex))).toBe(true);
  });

  it('the startup sweep deletes DEAD processes\' tmp debris and NOTHING else', async () => {
    const root = await freshRoot();
    await mkdir(path.join(root, 'tmp'), { recursive: true });
    await mkdir(path.join(root, 'sha256'), { recursive: true });
    // Debris of a crashed run: a non-PID name and a dir of a PID that is
    // certainly dead (PID_MAX on macOS is 99998, so 999999 names nobody).
    await writeFile(path.join(root, 'tmp', 'crashed-upload.abc'), 'debris');
    await mkdir(path.join(root, 'tmp', '999999'));
    await writeFile(path.join(root, 'tmp', '999999', 'half-upload'), 'debris');
    // @issue DTX-6206: a LIVE sibling server's in-flight upload (PID 1 =
    // launchd, always alive, never ours) — the sweep must not touch it, or a
    // second `detox-server` would break every upload in flight on the
    // first.
    await mkdir(path.join(root, 'tmp', '1'));
    await writeFile(path.join(root, 'tmp', '1', 'in-flight-upload'), 'live');
    // Not a valid digest name: ignored (not counted), but never deleted —
    // the sweep judges only its own tmp tree.
    await writeFile(path.join(root, 'sha256', 'not-a-digest'), 'foreign');

    const store = await BlobStore.open({ root });
    expect(existsSync(path.join(root, 'tmp', 'crashed-upload.abc'))).toBe(false);
    expect(existsSync(path.join(root, 'tmp', '999999'))).toBe(false);
    expect(existsSync(path.join(root, 'tmp', '1', 'in-flight-upload'))).toBe(true);
    expect(existsSync(path.join(root, 'sha256', 'not-a-digest'))).toBe(true);
    expect(store.has('not-a-digest')).toBe(false);
    expect(store.usedBytes).toBe(0);
  });

  it('refuses a nonsensical budget at open', async () => {
    await expect(BlobStore.open({ root: await freshRoot(), budgetBytes: 0 })).rejects.toThrow(
      /budget/,
    );
    await expect(BlobStore.open({ root: await freshRoot(), budgetBytes: -5 })).rejects.toThrow(
      /budget/,
    );
  });
});

describe('BlobStore — put', () => {
  /**
   * @issue DTX-6209
   * `put` returns 'already-present' without reading the body when the
   * entry's file is really there — a returning build is a hash check, not a
   * transfer.
   */
  it('answers already-present without restoring, and counts it as a use', async () => {
    const store = await BlobStore.open({ root: await freshRoot(), budgetBytes: 1024 * 1024 });
    const bytes = randomBytes(1024);
    const hex = await putBytes(store, bytes);
    expect(await store.put(hex, body(bytes), bytes.length)).toBe('already-present');
    expect(store.usedBytes).toBe(1024);
  });

  it('a digest mismatch stores nothing and leaves no temp debris', async () => {
    const root = await freshRoot();
    const store = await BlobStore.open({ root });
    const bytes = randomBytes(1024);
    const lyingName = hexOf(Buffer.from('other bytes'));
    await expect(store.put(lyingName, body(bytes), bytes.length)).rejects.toMatchObject({
      status: 400,
    });
    expect(store.has(lyingName)).toBe(false);
    expect(await tmpFiles(root)).toEqual([]);
  });

  it('a declared length the body does not honor is a 400', async () => {
    const store = await BlobStore.open({ root: await freshRoot() });
    const bytes = randomBytes(1024);
    await expect(store.put(hexOf(bytes), body(bytes), bytes.length + 1)).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      store.put(hexOf(bytes), body(bytes), Number.NaN),
    ).rejects.toBeInstanceOf(BlobRefusal);
  });

  /**
   * @issue DTX-6205
   * The name is the hash: a PUT streams to a temp file, the digest is
   * computed en route, and the entry is renamed into place only on a match.
   * The store can never hold bytes whose name lies, and a dead uploader's
   * debris never blocks an honest retry.
   */
  it('a mid-body death stores nothing, and the retry is never blocked', async () => {
    const root = await freshRoot();
    const store = await BlobStore.open({ root });
    const bytes = randomBytes(4096);
    const hex = hexOf(bytes);
    async function* dying(): AsyncGenerator<Uint8Array> {
      yield bytes.subarray(0, 1024);
      throw new Error('socket died');
    }
    await expect(store.put(hex, dying(), bytes.length)).rejects.toThrow('socket died');
    expect(store.has(hex)).toBe(false);
    expect(await tmpFiles(root)).toEqual([]);
    expect(await store.put(hex, body(bytes), bytes.length)).toBe('stored');
  });

  it('a phantom entry (file vanished behind our back) self-heals through pin and re-PUT', async () => {
    const root = await freshRoot();
    const store = await BlobStore.open({ root });
    const bytes = randomBytes(1024);
    const hex = await putBytes(store, bytes);

    // A cache cleaner (or a sibling server's eviction) deletes the file
    // while the table still lists it.
    await rm(store.pathOf(hex), { force: true });

    // @issue DTX-6208: a touch on the phantom has no file to write its
    // mtime back to — the write-back is fire-and-forget and must swallow
    // that, never throw.
    store.touch(hex);
    await new Promise((resolve) => setImmediate(resolve));

    // @issue DTX-6207: pin catches the lie, drops the entry, and answers
    // "absent" — the client's re-upload round can now genuinely heal it.
    expect(store.pin(hex)).toBe(false);
    expect(store.has(hex)).toBe(false);
    expect(store.usedBytes).toBe(0);

    // And the re-PUT stores fresh bytes instead of claiming already-present
    // over a hole.
    expect(await store.put(hex, body(bytes), bytes.length)).toBe('stored');
    expect(store.pin(hex)).toBe(true);
    store.unpin(hex);
  });

  it('a re-PUT straight onto a phantom (no pin first) also restores the file', async () => {
    const root = await freshRoot();
    const store = await BlobStore.open({ root });
    const bytes = randomBytes(1024);
    const hex = await putBytes(store, bytes);
    await rm(store.pathOf(hex), { force: true });
    expect(await store.put(hex, body(bytes), bytes.length)).toBe('stored');
    expect(existsSync(store.pathOf(hex))).toBe(true);
  });

  /**
   * @issue DTX-6210
   * A concurrent PUT of the same hex may win first while another streams
   * slowly. The loser must not clobber the winner's entry with `pins: 0` —
   * that would let eviction delete the file out from under a live install.
   */
  it('a concurrent PUT losing the same-hex race keeps the WINNER\'s entry — and its pins', async () => {
    const store = await BlobStore.open({ root: await freshRoot(), budgetBytes: 1024 * 1024 });
    const bytes = randomBytes(4096);
    const hex = hexOf(bytes);

    // The loser streams slowly; while it does, the winner stores the same
    // hex and an install pins it.
    let releaseLoser: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (releaseLoser = resolve));
    async function* slow(): AsyncGenerator<Uint8Array> {
      yield bytes.subarray(0, 1024);
      await gate;
      yield bytes.subarray(1024);
    }
    const loser = store.put(hex, slow(), bytes.length);
    expect(await store.put(hex, body(bytes), bytes.length)).toBe('stored');
    expect(store.pin(hex)).toBe(true);

    releaseLoser();
    expect(await loser).toBe('already-present');
    const big = randomBytes(1024 * 1024 - 2048);
    await expect(store.put(hexOf(big), body(big), big.length)).rejects.toMatchObject({
      status: 507, // the pinned entry survived the losing PUT — nothing evictable
    });
    store.unpin(hex);
  });
});

describe('BlobStore — budget, LRU and pins', () => {
  it('evicts the least-recently-USED unpinned entry, exactly one victim per shortfall', async () => {
    const store = await BlobStore.open({ root: await freshRoot(), budgetBytes: 2048 });
    const first = randomBytes(700);
    const second = randomBytes(700);
    const third = randomBytes(700);
    const firstHex = await putBytes(store, first);
    const secondHex = await putBytes(store, second);

    store.touch(firstHex); // fresher than second now
    const thirdHex = await putBytes(store, third);

    expect(store.has(secondHex)).toBe(false);
    expect(existsSync(store.pathOf(secondHex))).toBe(false);
    expect(store.has(firstHex)).toBe(true);
    expect(store.has(thirdHex)).toBe(true);
  });

  it('a pinned entry is never the victim; unpinning frees it', async () => {
    const store = await BlobStore.open({ root: await freshRoot(), budgetBytes: 2048 });
    const first = randomBytes(700);
    const second = randomBytes(700);
    const third = randomBytes(700);
    const firstHex = await putBytes(store, first);
    const secondHex = await putBytes(store, second);

    // First is the LRU candidate, but an in-flight install holds it.
    expect(store.pin(firstHex)).toBe(true);
    const thirdHex = await putBytes(store, third);
    expect(store.has(firstHex)).toBe(true);
    expect(store.has(secondHex)).toBe(false);
    expect(store.has(thirdHex)).toBe(true);
    store.unpin(firstHex);
  });

  it('answers 507 when room cannot be made because everything is pinned', async () => {
    const store = await BlobStore.open({ root: await freshRoot(), budgetBytes: 1500 });
    const first = randomBytes(700);
    const second = randomBytes(700);
    const firstHex = await putBytes(store, first);
    const secondHex = await putBytes(store, second);
    store.pin(firstHex);
    store.pin(secondHex);

    const third = randomBytes(700);
    await expect(store.put(hexOf(third), body(third), third.length)).rejects.toMatchObject({
      status: 507,
    });

    // Unpin one and the same admission goes through.
    store.unpin(firstHex);
    expect(await store.put(hexOf(third), body(third), third.length)).toBe('stored');
    expect(store.has(firstHex)).toBe(false);
  });

  it('a blob larger than the whole budget is 413, stored or not', async () => {
    const store = await BlobStore.open({ root: await freshRoot(), budgetBytes: 512 });
    const bytes = randomBytes(1024);
    await expect(store.put(hexOf(bytes), body(bytes), bytes.length)).rejects.toMatchObject({
      status: 413,
    });
  });

  /**
   * @issue DTX-6211
   * `deleteQuietly` is best-effort: by the time it runs, the store's
   * bookkeeping is already consistent, so a refusal costs disk, never
   * correctness.
   */
  it('deleteQuietly swallows a refusing filesystem — eviction bookkeeping never depends on it', async () => {
    // `rm` without `recursive` refuses a non-empty directory; the quiet
    // deleter must swallow exactly that kind of refusal.
    const dir = await freshRoot();
    await writeFile(path.join(dir, 'occupant'), 'x');
    await expect(deleteQuietly(dir)).resolves.toBeUndefined();
    expect(existsSync(dir)).toBe(true);
    // And on a plain file it genuinely deletes.
    await deleteQuietly(path.join(dir, 'occupant'));
    expect(existsSync(path.join(dir, 'occupant'))).toBe(false);
  });

  it('pin on an absent blob reports false instead of throwing (the eviction race is expected)', async () => {
    const store = await BlobStore.open({ root: await freshRoot() });
    expect(store.pin('0'.repeat(64))).toBe(false);
    // And unpin of anything unknown is a no-op, not a crash.
    store.unpin('0'.repeat(64));
    store.touch('0'.repeat(64));
    expect(store.budgetBytes).toBeGreaterThan(0);
  });
});
