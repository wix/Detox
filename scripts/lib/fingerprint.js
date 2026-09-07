'use strict';

/**
 * What an acceptance receipt actually vouches for.
 *
 * A commit id compared to HEAD is blind in both directions: editing
 * `packages/*\/src` after a green accept run leaves HEAD untouched, so a
 * commit id still matches; committing the edit first also leaves nothing for
 * a commit-based comparison to flag. A content fingerprint has neither hole:
 * it moves whenever a production source's bytes move, staged, committed, or
 * neither. The commit id stays in the receipt as provenance for a human,
 * never as the thing compared.
 *
 * The file set is production code as this repo defines it (`packages/x/src`
 * and `detox/src`, minus tests) — one definition, shared with `productionFiles`, so the thing
 * measured and the thing described cannot drift apart.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { createHash } = require('crypto');

const IS_TEST_FILE = /\.test\.(ts|mjs|cjs|js)$/;

function isProductionSource(file) {
  return /^(packages\/[^/]+|detox)\/src\//.test(file) && !IS_TEST_FILE.test(file) && !file.includes('/__tests__/');
}

/** Tracked and untracked-but-not-ignored production sources, sorted. */
function productionFiles(root) {
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', 'packages', 'detox/src'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return out
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && isProductionSource(line))
    .sort();
}

/**
 * @issue DTX-8000: moves with every edit to a production source — staged,
 * committed, or neither; ignores everything else.
 * `<count>:<sha1-16>` over every production source's path and bytes, or
 * `null` when git is unavailable (a reader must treat `null` as "could not
 * verify", never as a match).
 */
function productionFingerprint(root) {
  try {
    const files = productionFiles(root);
    const hash = createHash('sha1');
    for (const file of files) {
      hash.update(file);
      hash.update('\0');
      try {
        hash.update(fs.readFileSync(path.join(root, file)));
      } catch {
        // A file listed by git that we cannot read is itself a difference.
        hash.update('<unreadable>');
      }
      hash.update('\0');
    }
    return `${files.length}:${hash.digest('hex').slice(0, 16)}`;
  } catch {
    return null;
  }
}

module.exports = { productionFingerprint, productionFiles, isProductionSource };
