#!/usr/bin/env node
/**
 * Bundles the published tarball's TypeScript declarations (spec 009:
 * type-level `.` exports must equally resolve to the compat surface).
 *
 * One .d.ts per public door, emitted next to the door's .js so the staged
 * exports map can pair them:
 *   dist/index.d.ts     ← packages/compat/src/index.ts   (require('detox'))
 *   dist/internals.d.ts ← detox/src/internals.ts          (detox/client + /internals)
 *   dist/server.d.ts    ← packages/server/src/index.ts   (detox/server)
 *
 * dts-bundle-generator follows the root tsconfig's `paths`, so every
 * `@detox-remote/*` import resolves to workspace source and inlines — the
 * bundles are self-contained, like the esbuild output they describe.
 * `--no-check`: `yarn typecheck` is the type gate; this script only bundles.
 *
 *   node scripts/build-types.js        # after yarn install; no yarn build needed
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, 'detox', 'dist');
const generator = path.join(repoRoot, 'node_modules', '.bin', 'dts-bundle-generator');

const ENTRIES = [
  { entry: 'packages/compat/src/index.ts', out: 'index.d.ts', door: "require('detox') — the compat surface" },
  { entry: 'detox/src/internals.ts', out: 'internals.d.ts', door: 'detox/client + detox/internals' },
  { entry: 'packages/server/src/index.ts', out: 'server.d.ts', door: 'detox/server' },
];

/**
 * The generator inlines @types/ws (which imports node builtins bare: 'http')
 * next to our sources (which import them prefixed: 'node:http'), and TS then
 * sees the same name imported twice — a real TS2300. Normalize the prefix
 * away and merge every named-import list per module, first binding wins.
 */
function mergeImports(dts) {
  const lines = dts.split('\n');
  const importRe = /^import (?:type )?\{ ?(.*?) ?\} from '([^']+)';$/;
  const byModule = new Map();
  const seenLocals = new Set();
  const body = [];
  for (const line of lines) {
    const match = importRe.exec(line);
    if (match === null) {
      body.push(line);
      continue;
    }
    const module = match[2].replace(/^node:/, '');
    if (!byModule.has(module)) byModule.set(module, []);
    for (const token of match[1].split(',').map((t) => t.trim()).filter(Boolean)) {
      const local = token.split(/\s+as\s+/).pop();
      if (seenLocals.has(local)) continue;
      seenLocals.add(local);
      byModule.get(module).push(token);
    }
  }
  const imports = [...byModule.entries()]
    .filter(([, tokens]) => tokens.length > 0)
    .map(([module, tokens]) => `import { ${tokens.join(', ')} } from '${module}';`);
  return [...imports, ...body].join('\n');
}

fs.mkdirSync(outDir, { recursive: true });
for (const { entry, out, door } of ENTRIES) {
  const outPath = path.join(outDir, out);
  execFileSync(
    generator,
    [
      '--project', path.join(repoRoot, 'tsconfig.json'),
      '--no-check',
      '--no-banner',
      // `ws` is bundled into the js by esbuild; its types inline here the
      // same way so the tarball needs no @types/ws.
      '--external-inlines', 'ws',
      '-o', outPath,
      path.join(repoRoot, entry),
    ],
    { cwd: repoRoot, stdio: ['ignore', 'pipe', 'inherit'] },
  );
  if (!fs.existsSync(outPath)) {
    console.error(`build-types: ${outPath} was not produced (${door})`);
    process.exit(1);
  }
  fs.writeFileSync(outPath, mergeImports(fs.readFileSync(outPath, 'utf8')));
  console.log(`build-types: ${path.relative(repoRoot, outPath)} ← ${entry} (${door})`);
}

// The jest `expect` augmentation (spec 010) rides the compat door's bundle:
// importing 'detox' is what turns the Detox matcher typings on, mirroring the
// runtime (`expect.extend` runs in the shipped jest environment). Appended
// verbatim from its checked-in source of truth.
const augmentation = fs.readFileSync(
  path.join(repoRoot, 'packages', 'compat', 'src', 'jest', 'expect-augmentation.d.ts'),
  'utf8',
);
const indexDts = path.join(outDir, 'index.d.ts');
fs.appendFileSync(indexDts, `\n${augmentation}`);
console.log('build-types: dist/index.d.ts += the jest expect augmentation (spec 010)');
