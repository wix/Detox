#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * Packs `detox` into a standalone, installable tarball — the alpha-1
 * artifact (spec 009's packaging section).
 *
 * The workspace package cannot be `npm pack`ed as-is: its manifest names
 * `workspace:*` dependencies that exist only inside this monorepo, while the
 * built `dist/` bundles all of them (and `ws`, and zod inside the CLI)
 * inline. So this script stages a minimal manifest + the built artifacts in
 * a temp dir and packs that — the result installs into any project with
 * plain `npm install <tarball>`, no registry, no workspace.
 *
 * What the tarball serves (spec 009):
 *   require('detox')      → dist/index.js    — the compat surface (a
 *                           migrating project changes no import line)
 *   detox/client          → dist/internals.js — the handle-based API
 *   detox/internals       → the same file — alias kept for frozen accepts
 *   detox/server          → dist/server.js  — the programmatic server door
 *   bin `detox`           → dist/cli/detox.js — test/build/server/relay
 *
 * Types ship with the code: this script runs scripts/build-types.js itself,
 * so the staged exports map pairs every door's .js with its bundled .d.ts.
 *
 *   yarn build && node scripts/pack-client.js [dest-dir]   # default: detox/dist/pack
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const pkgDir = path.join(repoRoot, 'detox');
const distDir = path.join(pkgDir, 'dist');
const cliBundle = path.join(distDir, 'cli', 'detox.js');
const serverCliBundle = path.join(distDir, 'server', 'cli.js');

// The declaration bundles are rebuilt on every pack — a stale .d.ts lying
// next to a fresh .js is the drift a typed tarball must not ship.
execFileSync('node', [path.join(__dirname, 'build-types.js')], { stdio: 'inherit' });

for (const [artifact, hint] of [
  [path.join(distDir, 'index.js'), 'the compat `.` entry'],
  [path.join(distDir, 'internals.js'), 'the client bundle'],
  [path.join(distDir, 'server.js'), 'the detox/server door'],
  [path.join(distDir, 'index.d.ts'), 'the compat types'],
  [path.join(distDir, 'internals.d.ts'), 'the client types'],
  [path.join(distDir, 'server.d.ts'), 'the server types'],
  [path.join(distDir, 'runners', 'jest', 'index.js'), 'the detox/runners/jest door (spec 010)'],
  [path.join(distDir, 'runners', 'jest', 'testEnvironment.js'), 'the jest environment (spec 010)'],
  [path.join(distDir, 'runners', 'jest', 'globalSetup.js'), 'the jest globalSetup (spec 010)'],
  [path.join(distDir, 'runners', 'jest', 'globalTeardown.js'), 'the jest globalTeardown (spec 010)'],
  [path.join(distDir, 'runners', 'jest', 'reporter.js'), 'the jest reporter (spec 010)'],
  [cliBundle, 'the detox bin'],
  [serverCliBundle, 'the detached local helper server bin (spec 011)'],
]) {
  if (!fs.existsSync(artifact)) {
    console.error(`pack-client: ${artifact} is missing (${hint}) — run \`yarn build\` first.`);
    process.exit(1);
  }
}

const manifest = /** @type {{ version: string, description: string, license: string }} */ (
  JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'))
);
const { version, description, license } = manifest;
// One node pin, one source of truth: the tarball refuses the same runtimes
// the repo does.
const { engines } = /** @type {{ engines: { node: string } }} */ (
  JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'))
);

const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'detox-pack-'));
try {
  fs.writeFileSync(
    path.join(staging, 'package.json'),
    JSON.stringify(
      {
        name: 'detox',
        version,
        description,
        bin: { detox: './dist/cli/detox.js' },
        // `types` first in each condition set — nodenext consumers read the
        // map in order; the bare `types` field serves node10-resolution ones.
        types: './dist/index.d.ts',
        exports: {
          '.': { types: './dist/index.d.ts', default: './dist/index.js' },
          './client': { types: './dist/internals.d.ts', default: './dist/internals.js' },
          './internals': { types: './dist/internals.d.ts', default: './dist/internals.js' },
          './server': { types: './dist/server.d.ts', default: './dist/server.js' },
          // The jest integration (spec 010): exact paths a migrant's
          // jest.config.js names, plus the v20 index for destructuring.
          // No `types` condition here — these are runtime module paths for
          // jest's resolver; the matcher typings ride dist/index.d.ts
          // (build-types appends the expect augmentation there).
          './runners/jest': './dist/runners/jest/index.js',
          './runners/jest/index': './dist/runners/jest/index.js',
          './runners/jest/testEnvironment': './dist/runners/jest/testEnvironment.js',
          './runners/jest/globalSetup': './dist/runners/jest/globalSetup.js',
          './runners/jest/globalTeardown': './dist/runners/jest/globalTeardown.js',
          './runners/jest/reporter': './dist/runners/jest/reporter.js',
          './package.json': './package.json',
        },
        engines,
        license,
      },
      null,
      2,
    ) + '\n',
  );
  // No sourcemaps: they embed `sourcesContent` for the whole monorepo
  // (core, protocol, bundled ws) — not something a handed-out tarball
  // should carry. No prior pack output either (dist/pack is the default dest).
  fs.cpSync(distDir, path.join(staging, 'dist'), {
    recursive: true,
    filter: (src) => !src.endsWith('.map') && path.basename(src) !== 'pack',
  });

  const dest = path.resolve(repoRoot, process.argv[2] ?? path.join('detox', 'dist', 'pack'));
  fs.mkdirSync(dest, { recursive: true });
  const output = execFileSync('npm', ['pack', '--pack-destination', dest], {
    cwd: staging,
    encoding: 'utf8',
  });
  const tarball = output.trim().split('\n').pop();
  console.log(path.join(dest, tarball));
} finally {
  fs.rmSync(staging, { recursive: true, force: true });
}
