/**
 * A driver is an npm package the server imports BY NAME (spec 015), from
 * wherever the server itself runs — which in this repo is the bundled CLI at
 * `detox/dist/server/cli.js`. Node answers a by-name import by walking up from
 * the importing file and checking each `node_modules` on the way.
 *
 * That walk is the whole contract here, and this repo makes it easy to break:
 * `.yarnrc.yml` sets `nmHoistingLimits: workspaces`, so a workspace package is
 * NOT linked into the root `node_modules` just by being a workspace. A driver
 * that the server must import by name has to be a dependency of something on
 * the walk — for the spec-015 fixture, a root devDependency.
 *
 * Nothing else catches this. Typecheck resolves through `tsconfig` paths, lint
 * and unit tests import by relative path, and the driver host only loads a
 * package when a request names it — so a broken layout stays invisible until a
 * spawned server tries the import and answers `DETOX_NO_MATCHING_DEVICE` with
 * an `ERR_MODULE_NOT_FOUND` inside it, minutes into an acceptance run.
 *
 * `require.resolve` stands in for the ESM import the server performs: both walk
 * the same `node_modules` chain, and the start directory need not exist for the
 * walk to be faithful.
 */
import path from 'node:path';
import { createRequire } from 'node:module';

import { describe, it, expect } from 'vitest';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
/** Where the bundled server CLI runs from — the real start of the walk. */
const SERVER_CLI_DIR = path.join(REPO_ROOT, 'detox', 'dist', 'server');
/** Any file in the repo works as the base: every lookup below passes `paths` explicitly. */
const require_ = createRequire(path.join(REPO_ROOT, 'package.json'));

describe('a driver package resolves by name from where the server runs', () => {
  it('finds the spec-015 fixture driver from the bundled CLI directory', () => {
    expect(() => require_.resolve('spec015-fake-driver', { paths: [SERVER_CLI_DIR] })).not.toThrow();
  });

  it('resolves it to this repo, not to some copy under a node_modules of its own', () => {
    const resolved = require_.resolve('spec015-fake-driver', { paths: [SERVER_CLI_DIR] });
    expect(resolved.startsWith(path.join(REPO_ROOT, 'specs', 'fake-driver'))).toBe(true);
  });

  it('reports a package nobody installed as unresolvable, so the check can fail', () => {
    expect(() =>
      require_.resolve('spec015-driver-that-nobody-installed', { paths: [SERVER_CLI_DIR] }),
    ).toThrow(/Cannot find module/);
  });
});
