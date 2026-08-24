#!/usr/bin/env node
/**
 * Publish `detox` and `detox-cli` from this machine, with a human holding the OTP.
 *
 *   node scripts/publish-local.mjs --tag alpha
 *   node scripts/publish-local.mjs --tag alpha --dry-run --skip-ios
 *   node scripts/publish-local.mjs --tag v21 --version 21.1.0-alpha.0
 *
 * Every slow step runs before the OTP prompt: `npm publish <file>.tgz` skips
 * `prepack`, so a 30-second code only has to survive the upload, not a rebuild.
 */
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const semver = require('semver');

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGES = ['detox', 'detox-cli'];
const FRAMEWORK_TBZ = path.join(repoRoot, 'detox', 'Detox-ios-framework.tbz');

const c = {
  dim: (s) => `[2m${s}[0m`,
  bold: (s) => `[1m${s}[0m`,
  red: (s) => `[31m${s}[0m`,
  green: (s) => `[32m${s}[0m`,
  yellow: (s) => `[33m${s}[0m`,
  cyan: (s) => `[36m${s}[0m`,
};

function step(msg) {
  console.log(`\n${c.cyan('▶')} ${c.bold(msg)}`);
}
function info(msg) {
  console.log(`  ${msg}`);
}
// Thrown, never `process.exit`: an exit here would skip the package.json rollback.
class Abort extends Error {}

function die(msg) {
  throw new Abort(msg);
}

function parseArgs(argv) {
  const opts = { tag: null, version: null, dryRun: false, skipIos: false, otpOnce: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--tag') opts.tag = argv[++i];
    else if (arg.startsWith('--tag=')) opts.tag = arg.slice('--tag='.length);
    else if (arg === '--version') opts.version = argv[++i];
    else if (arg.startsWith('--version=')) opts.version = arg.slice('--version='.length);
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--skip-ios') opts.skipIos = true;
    else if (arg === '--otp-once') opts.otpOnce = true;
    else die(`Unknown argument: ${arg}`);
  }
  if (!opts.tag) {
    die(
      'Refusing to run without --tag.\n' +
        '  A bare `npm publish` sets the `latest` dist-tag even for a prerelease version,\n' +
        '  which would serve this alpha to everyone running `npm install detox`.\n' +
        '  Pass e.g. --tag alpha (or a fresh tag like --tag v21-alpha, which moves nothing).',
    );
  }
  if (opts.tag === 'latest') {
    die('--tag latest is not something this script will do. Use scripts/publish.sh or npm directly.');
  }
  return opts;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function pkgJsonPath(pkg) {
  return path.join(repoRoot, pkg, 'package.json');
}

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { cwd: repoRoot, encoding: 'utf8', ...opts });
}

function mb(bytes) {
  return bytes < 1e6 ? `${Math.round(bytes / 1e3)} kB` : `${(bytes / 1e6).toFixed(1)} MB`;
}

function preflight() {
  step('Preflight');

  let who;
  try {
    who = run('npm', ['whoami']).trim();
  } catch {
    die(
      'npm is not authenticated on this machine.\n' +
        '  Run `npm login` yourself first (it needs its own OTP), then re-run this script.',
    );
  }
  info(`npm user: ${c.bold(who)}`);

  const yarnVersion = run('yarn', ['--version']).trim();
  if (!yarnVersion.startsWith('4')) die(`Yarn 4.x required (publishNewVersion asserts this too), got ${yarnVersion}`);
  info(`yarn: ${yarnVersion}`);

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  const enginesPin = readJson(path.join(repoRoot, 'package.json')).engines?.node;
  if (nodeMajor !== 24) {
    console.log(`  ${c.yellow('!')} node ${process.versions.node} but the repo pins "${enginesPin}" — run \`nvm use\` if the build misbehaves.`);
  } else {
    info(`node: ${process.versions.node}`);
  }

  const dirty = run('git', ['status', '--porcelain']).trim();
  if (dirty) {
    console.log(`  ${c.yellow('!')} working tree is not clean:`);
    for (const line of dirty.split('\n').slice(0, 10)) console.log(`      ${line}`);
  }
  info(`commit: ${run('git', ['rev-parse', '--short', 'HEAD']).trim()} on ${run('git', ['rev-parse', '--abbrev-ref', 'HEAD']).trim()}`);
}

function resolveVersion(opts) {
  step('Version');
  const rootPkg = readJson(path.join(repoRoot, 'package.json'));
  const current = rootPkg.version;

  const next = opts.version ?? semver.inc(current, 'prerelease', opts.tag);
  if (!next) die(`Could not compute a version from ${current} with --preid=${opts.tag}`);
  if (!semver.valid(next)) die(`--version ${next} is not valid semver`);

  info(`current root version : ${current}`);
  info(`publishing as        : ${c.bold(next)}   dist-tag ${c.bold(opts.tag)}`);

  try {
    const published = JSON.parse(run('npm', ['view', 'detox', 'versions', '--json'])).filter((v) => semver.valid(v));
    // An older `rc` outranks any `alpha` of the same tuple, so `detox@<major>` can
    // resolve to an abandoned line rather than to this build. Warn, don't block.
    const range = `^${next}`;
    const rival = String(semver.maxSatisfying([...published, next], range, { includePrerelease: true }) ?? '');
    if (rival !== '' && rival !== next) {
      console.log(
        `  ${c.yellow('!')} ${next} does NOT win its own range: \`detox@${semver.major(next)}\` / \`detox@${range}\`\n` +
          `      resolves to ${c.bold(rival)} — the abandoned earlier v21 line — not to this build.\n` +
          `      Install \`detox@${opts.tag}\` or the exact version. Expected for an alpha; to beat it,\n` +
          `      pass a --version above ${rival}.`,
      );
    }
  } catch {
    /* offline or an npm hiccup — not worth failing the run over */
  }

  try {
    run('npm', ['view', `detox@${next}`, 'version'], { stdio: 'pipe' });
    die(`detox@${next} is already published. Pass a different --version.`);
  } catch (err) {
    if (!/E404|404/.test(String(err.stdout ?? '') + String(err.stderr ?? '') + err.message)) throw err;
  }

  return { current, next };
}

function applyVersion(version) {
  const backups = new Map();
  for (const file of [path.join(repoRoot, 'package.json'), ...PACKAGES.map(pkgJsonPath)]) {
    backups.set(file, fs.readFileSync(file, 'utf8'));
    const json = JSON.parse(backups.get(file));
    json.version = version;
    fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
  }
  return () => {
    for (const [file, content] of backups) fs.writeFileSync(file, content);
    console.log(`  ${c.dim('restored root, detox and detox-cli package.json')}`);
  };
}

function packIos(opts) {
  step('Package iOS');
  if (opts.skipIos) {
    if (!fs.existsSync(FRAMEWORK_TBZ)) {
      die('--skip-ios was passed but detox/Detox-ios-framework.tbz does not exist. Drop --skip-ios.');
    }
    info(`reusing existing tarballs ${c.dim('(--skip-ios)')}`);
  } else {
    info('running scripts/ci.ios-release.sh (sources + framework + XCUITest) — a few minutes…');
    execSync('scripts/ci.ios-release.sh', { cwd: repoRoot, stdio: 'inherit' });
  }

  const tbz = fs.readdirSync(path.join(repoRoot, 'detox')).filter((f) => f.endsWith('.tbz')).sort();
  if (!tbz.includes('Detox-ios-framework.tbz')) {
    die(
      'Detox-ios-framework.tbz was not produced. Without it the published package installs\n' +
        '  no Detox.framework and `launchApp` cannot instrument an app.',
    );
  }
  for (const f of tbz) info(`${f} ${c.dim(mb(fs.statSync(path.join(repoRoot, 'detox', f)).size))}`);
}

function packPackages(version) {
  step('Pack (this is the slow part — it runs prepack: yarn build + build:types)');
  const tarballs = {};
  for (const pkg of PACKAGES) {
    const dir = path.join(repoRoot, pkg);
    const out = execFileSync('npm', ['pack'], { cwd: dir, encoding: 'utf8' }).trim().split('\n').pop();
    const file = path.join(dir, out);
    if (!fs.existsSync(file)) die(`npm pack in ${pkg} produced no tarball (${out})`);
    tarballs[pkg] = file;

    const listed = execFileSync('tar', ['-tzf', file], { encoding: 'utf8' }).split('\n').filter(Boolean);
    const hasFramework = listed.some((f) => f.endsWith('Detox-ios-framework.tbz'));
    const hasDistIndex = listed.some((f) => f === 'package/dist/index.js');
    const hasDistTypes = listed.some((f) => f === 'package/dist/index.d.ts');

    info(`${c.bold(pkg)}@${version} → ${out}`);
    info(`  ${mb(fs.statSync(file).size)}, ${listed.length} files`);
    if (pkg === 'detox') {
      const mark = (ok) => (ok ? c.green('✓') : c.red('✗'));
      info(`  ${mark(hasDistIndex)} dist/index.js   ${mark(hasDistTypes)} dist/index.d.ts   ${mark(hasFramework)} Detox-ios-framework.tbz`);
      if (!hasDistIndex || !hasDistTypes || !hasFramework) {
        die('The detox tarball is missing a required artifact (see above). Refusing to publish it.');
      }
    }
  }
  return tarballs;
}

// `rl.question` never settles if stdin closes first (a piped run, or ^D), so race
// it against the close event — otherwise an EOF strands the await and skips rollback.
async function ask(rl, question) {
  let onClose;
  const closed = new Promise((_resolve, reject) => {
    onClose = () => reject(new Error('stdin closed before the prompt was answered — aborting'));
    rl.once('close', onClose);
  });
  try {
    const answer = await Promise.race([rl.question(question), closed]);
    return answer.trim();
  } finally {
    rl.off('close', onClose);
  }
}

async function publish(tarballs, version, opts) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const published = [];
  let sharedOtp = null;

  try {
    step('Publish');
    console.log(`  About to publish, to ${c.bold('https://registry.npmjs.org')}:`);
    for (const pkg of PACKAGES) console.log(`    ${pkg}@${c.bold(version)}  --tag ${c.bold(opts.tag)}`);
    if (opts.dryRun) console.log(`  ${c.yellow('DRY RUN — nothing will actually be sent.')}`);

    const go = await ask(rl, `\n  Type ${c.bold('yes')} to continue: `);
    if (go !== 'yes') die('Aborted by user.');

    for (const pkg of PACKAGES) {
      let otp = opts.otpOnce ? sharedOtp : null;

      for (let attempt = 1; ; attempt++) {
        if (!otp) {
          console.log(
            `\n  ${c.bold(`Open your Authenticator now.`)} Everything is already built —\n` +
              `  ${c.dim(`only the upload of ${mb(fs.statSync(tarballs[pkg]).size)} happens after you hit enter.`)}`,
          );
          otp = await ask(rl, `  OTP for ${c.bold(pkg)} (blank if your 2FA does not gate writes): `);
          if (opts.otpOnce) sharedOtp = otp;
        }

        const args = ['publish', tarballs[pkg], '--tag', opts.tag];
        if (otp) args.push(`--otp=${otp}`);
        if (opts.dryRun) args.push('--dry-run');

        try {
          const started = Date.now();
          execFileSync('npm', args, { cwd: repoRoot, stdio: 'inherit' });
          console.log(`  ${c.green('✓')} ${pkg}@${version} published in ${((Date.now() - started) / 1000).toFixed(1)}s`);
          published.push(pkg);
          break;
        } catch (err) {
          const text = String(err.stdout ?? '') + String(err.stderr ?? '') + err.message;
          if (/EOTP|one-time pass|otp/i.test(text) && attempt < 3) {
            console.log(`  ${c.yellow('!')} That code was rejected or expired. Let's try a fresh one.`);
            otp = null;
            sharedOtp = null;
            continue;
          }
          if (/E404|E403|403|404/.test(text)) {
            console.log(
              `\n  ${c.red('Registry refused the write.')} On an existing package npm masks 401/403 as 404 —\n` +
                `  it means this account cannot publish ${pkg}, not that the package is missing.`,
            );
          }
          throw err;
        }
      }
    }
  } finally {
    rl.close();
  }
  return published;
}

function verify(version, opts, published) {
  step('Verify');
  for (const pkg of published) {
    try {
      const v = run('npm', ['view', `${pkg}@${version}`, 'version']).trim();
      const tagged = run('npm', ['view', pkg, `dist-tags.${opts.tag}`]).trim();
      console.log(`  ${c.green('✓')} ${pkg}@${v} is live; dist-tag ${opts.tag} → ${tagged}`);
    } catch {
      console.log(`  ${c.yellow('!')} ${pkg}@${version} not visible yet — the registry CDN lags a few seconds.`);
    }
  }
  console.log(`\n  Install it with:  ${c.bold(`npm i detox@${opts.tag}`)}   ${c.dim(`(or detox@${version})`)}`);
}

let opts, next;
try {
  opts = parseArgs(process.argv.slice(2));
  preflight();
  ({ next } = resolveVersion(opts));
} catch (err) {
  if (!(err instanceof Abort)) throw err;
  console.error(`\n${c.red('✖')} ${err.message}\n`);
  process.exit(1);
}

const restore = applyVersion(next);

let published = [];
try {
  packIos(opts);
  const tarballs = packPackages(next);
  published = await publish(tarballs, next, opts);
} catch (err) {
  if (published.length === 0) {
    console.error(`\n${c.red('✖')} Failed before anything was published — rolling the version back.`);
    restore();
  } else {
    console.error(`\n${c.red('✖')} Failed after publishing ${published.join(', ')} — leaving package.json at ${next}.`);
  }
  console.error(err.message);
  process.exit(1);
}

verify(next, opts, published);

if (opts.dryRun) {
  restore();
  console.log(`\n${c.dim('Dry run finished; version rolled back.')}`);
} else {
  console.log(
    `\n  ${c.dim('package.json files are left at')} ${next}${c.dim('. CI would open a bump PR here; commit or revert as you prefer.')}`,
  );
}
