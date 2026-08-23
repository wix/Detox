const path = require('node:path');
const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

const rebuildPlugin = {
  name: 'rebuild-notify',
  setup(build) {
    build.onEnd(result => {
      if (result.errors.length === 0) {
        console.log(`[${new Date().toISOString()}] Rebuilt ${build.initialOptions.outfile}`);
      }
    });
  },
};

// The `detox` package has no `exports` map (deep imports such as
// `detox/runners/jest/reporter` are part of its public surface), so a bare
// `require('detox/internals')` inside detox/dist would only resolve through
// a node_modules/detox entry above it. Rewrite those imports to paths relative
// to the bundle instead: every bundle then shares the one dist/internals.js
// regardless of where the package is installed.
const DETOX_DIST = path.resolve(__dirname, 'detox', 'dist');
const relativeDetoxPlugin = {
  name: 'relative-detox',
  setup(build) {
    const outDir = path.dirname(path.resolve(__dirname, build.initialOptions.outfile));
    build.onResolve({ filter: /^detox(\/.*)?$/ }, (args) => {
      const target = args.path === 'detox' ? 'index.js' : `${args.path.slice('detox/'.length)}.js`;
      let rel = path.relative(outDir, path.join(DETOX_DIST, target)).split(path.sep).join('/');
      if (!rel.startsWith('.')) rel = `./${rel}`;
      return { path: rel, external: true };
    });
  },
};

const commonOptions = {
  bundle: true,
  platform: 'node',
  // Matches the repo's engines pin (">=24 <25").
  target: 'node24',
  sourcemap: true,
  plugins: [relativeDetoxPlugin, rebuildPlugin],
};

async function build() {
  // The `detox` package bundles into detox/dist; the thin shims at the
  // package root (index.js, internals.js, runners/jest/*.js) point there. Spec 009 is settled here, at the build
  // boundary: the `.` entry is the compat surface (`require('detox')`
  // changes no import line in a migrating project), while source dependencies
  // stay one-way — compat imports `detox/internals`, which stays external and
  // resolves relative to the bundle (see relativeDetoxPlugin).
  const detoxCtx = await esbuild.context({
    ...commonOptions,
    entryPoints: ['packages/compat/src/index.ts'],
    outfile: 'detox/dist/index.js',
  });

  const internalsCtx = await esbuild.context({
    ...commonOptions,
    entryPoints: ['detox/src/internals.ts'],
    outfile: 'detox/dist/internals.js',
  });

  // `detox/server` — the server's programmatic API (spec 009). One
  // `npm i detox` installs every role.
  const serverApiCtx = await esbuild.context({
    ...commonOptions,
    entryPoints: ['packages/server/src/index.ts'],
    outfile: 'detox/dist/server.js',
  });

  // `detox/runners/jest/*` — the jest integration (spec 010). Five thin
  // entries over packages/compat/src/jest; `detox/internals` stays external
  // in each, so every bundle shares one dist/internals.js at runtime (and
  // the compat state box makes the compat copies share one session).
  // jest-environment-node and @jest/reporters are resolved from the project
  // at runtime (createRequire on cwd) — the tarball bundles no jest.
  const jestRunnerCtxs = await Promise.all(
    ['index', 'testEnvironment', 'globalSetup', 'globalTeardown', 'reporter'].map((entry) =>
      esbuild.context({
        ...commonOptions,
        entryPoints: [`packages/compat/src/jest/${entry}.ts`],
        outfile: `detox/dist/runners/jest/${entry}.js`,
      }),
    ),
  );

  const serverCtx = await esbuild.context({
    ...commonOptions,
    entryPoints: ['packages/server/src/cli.ts'],
    outfile: 'detox/dist/server/cli.js',
    banner: {
      js: '#!/usr/bin/env node',
    },
  });

  // The relay (spec 008) — a fourth surface, its own binary.
  const relayCtx = await esbuild.context({
    ...commonOptions,
    entryPoints: ['packages/relay/src/cli.ts'],
    outfile: 'detox/dist/relay/cli.js',
    banner: {
      js: '#!/usr/bin/env node',
    },
  });

  // The `detox` bin (spec 009) — test/build/server/relay verbs. zod bundles
  // in here and only here: it reaches neither the client bundle nor a jest
  // worker.
  const cliCtx = await esbuild.context({
    ...commonOptions,
    entryPoints: ['packages/cli/src/main.ts'],
    outfile: 'detox/dist/cli/detox.js',
    banner: {
      js: '#!/usr/bin/env node',
    },
  });

  const contexts = [detoxCtx, internalsCtx, serverApiCtx, ...jestRunnerCtxs, serverCtx, relayCtx, cliCtx];

  if (watch) {
    await Promise.all(contexts.map((ctx) => ctx.watch()));
    console.log('Watching for changes...');
  } else {
    await Promise.all(contexts.map((ctx) => ctx.rebuild()));
    await Promise.all(contexts.map((ctx) => ctx.dispose()));
    console.log('Build complete');
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
