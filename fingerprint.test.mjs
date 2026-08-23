/**
 * What an acceptance receipt vouches for: a content fingerprint over
 * production sources, not a commit id.
 */
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { productionFingerprint, isProductionSource } = require('./scripts/lib/fingerprint.js');

const ROOT = path.dirname(new URL(import.meta.url).pathname);

/** A throwaway git repo shaped like this workspace's production layout. */
function scratchRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'detox-fingerprint-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' });
  git('init', '-q');
  fs.mkdirSync(path.join(dir, 'packages/core/src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'packages/core/src/index.ts'), 'export const a = 1;\n');
  fs.writeFileSync(path.join(dir, 'packages/core/src/index.test.ts'), 'test stuff\n');
  fs.writeFileSync(path.join(dir, 'README.md'), 'docs\n');
  return { dir, git };
}

describe('isProductionSource', () => {
  it('is packages/x/src and detox/src, minus tests', () => {
    expect(isProductionSource('packages/compat/src/index.ts')).toBe(true);
    expect(isProductionSource('detox/src/index.ts')).toBe(true);
    expect(isProductionSource('detox/src/index.test.ts')).toBe(false);
    expect(isProductionSource('detox/src/__tests__/helper.ts')).toBe(false);
    expect(isProductionSource('detox/test/e2e/01.sanity.test.js')).toBe(false);
    expect(isProductionSource('detox/scripts/postinstall.js')).toBe(false);
    expect(isProductionSource('specs/009-config-cli.accept.ts')).toBe(false);
    expect(isProductionSource('scripts/accept.js')).toBe(false);
  });
});

/**
 * @issue DTX-8000
 * A commit id compared to HEAD is blind in both directions: uncommitted
 * edits after a green accept run leave HEAD untouched, and committing the
 * change first leaves nothing for a commit-based comparison to flag. A
 * content fingerprint has neither hole: it moves when a production source's
 * bytes move, staged, committed, or neither, and does not move for anything
 * else.
 */
describe('productionFingerprint', () => {
  it('reads as <count>:<hash> over this repo', () => {
    expect(productionFingerprint(ROOT)).toMatch(/^\d+:[0-9a-f]{16}$/);
  });

  it('moves when a production source changes, committed or not', () => {
    const { dir, git } = scratchRepo();
    const before = productionFingerprint(dir);
    fs.appendFileSync(path.join(dir, 'packages/core/src/index.ts'), 'export const b = 2;\n');
    const dirty = productionFingerprint(dir);
    expect(dirty).not.toBe(before);
    // Committing it changes nothing: the fingerprint is over content.
    git('add', '-A');
    git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'x');
    expect(productionFingerprint(dir)).toBe(dirty);
  });

  it('ignores docs and test files — they do not move the fingerprint', () => {
    const { dir } = scratchRepo();
    const before = productionFingerprint(dir);
    fs.appendFileSync(path.join(dir, 'README.md'), 'more docs\n');
    fs.appendFileSync(path.join(dir, 'packages/core/src/index.test.ts'), 'more tests\n');
    expect(productionFingerprint(dir)).toBe(before);
  });

  it('counts a brand-new untracked source', () => {
    const { dir } = scratchRepo();
    const before = productionFingerprint(dir);
    fs.writeFileSync(path.join(dir, 'packages/core/src/added.ts'), 'export const c = 3;\n');
    expect(productionFingerprint(dir)).not.toBe(before);
  });
});
