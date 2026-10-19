const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const adapter = require('./detox.cjs');
const { check, compareVersions, validateManifest } = require('./policy.cjs');

function exec(command, args, options = {}) {
  return execFileSync(command, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, ...options });
}

function integrity(file) {
  return `sha512-${createHash('sha512').update(fs.readFileSync(file)).digest('base64')}`;
}

function validatePackageFiles(files, pkg) {
  const spec = adapter.packages.find((item) => item.name === pkg.name);
  check(spec, 'Unexpected packed package name');
  const names = new Set(files);
  for (const file of spec.requiredFiles(pkg.version))
    check(names.has(file), `Package ${pkg.name} is missing ${file}`);
  for (const file of files) {
    check(
      !file.startsWith('/') && !file.split('/').includes('..') && !file.includes('\\'),
      `Unsafe package path: ${file}`
    );
    check(
      !/(^|\/)(node_modules|\.npmrc|\.git|\.github|\.buildkite|\.gradle|\.yarn|DerivedData|build_temp\w*)(\/|$)/.test(
        file
      ),
      `Unexpected private/build path: ${file}`
    );
    check(
      !/^(test|examples|website|coverage|artifacts|allure-results)\//.test(file),
      `Unexpected development file: ${file}`
    );
    check(
      !/\.(apk|aab|ipa|jks|keystore)$/.test(file),
      `Unexpected native binary/credential: ${file}`
    );
  }
  check(
    pkg.repository?.url === `https://github.com/${adapter.repository}.git`,
    'Package repository must match npm trust'
  );
  const bin = typeof pkg.bin === 'string' ? [pkg.bin] : Object.values(pkg.bin || {});
  const entries = [pkg.main, pkg.types, pkg['react-native'], ...bin];
  for (const value of Object.values(pkg.exports || {})) {
    if (typeof value === 'string') entries.push(value);
    else entries.push(...Object.values(value));
  }
  for (const entry of entries.filter((value) => value !== undefined)) {
    check(
      typeof entry === 'string' && names.has(entry.replace(/^\.\//, '')),
      `Unresolvable package entry: ${entry}`
    );
  }
}

function pack(directory) {
  check(
    compareVersions(exec('npm', ['--version']).trim(), '11.17.0') >= 0,
    'Package preparation requires npm >=11.17.0 (Node 24.19.0); older npm can run prepare despite --ignore-scripts'
  );
  fs.mkdirSync(directory, { recursive: true });
  return adapter.packages.map((spec) => {
    const output = exec(
      'npm',
      ['pack', '--ignore-scripts', '--json', '--pack-destination', directory],
      { cwd: spec.directory }
    );
    const results = JSON.parse(output);
    check(results.length === 1, `Expected one ${spec.name} tarball`);
    const result = results[0];
    const pkg = JSON.parse(fs.readFileSync(path.join(spec.directory, 'package.json'), 'utf8'));
    check(pkg.name === spec.name, 'Unexpected packed package name');
    validatePackageFiles(
      result.files.map((file) => file.path),
      pkg
    );
    const actual = integrity(path.join(directory, result.filename));
    check(actual === result.integrity, 'npm pack integrity mismatch');
    return { name: pkg.name, version: pkg.version, filename: result.filename, integrity: actual };
  });
}

function readManifest(directory, options) {
  const manifest = validateManifest(
    JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8')),
    options
  );
  for (const pkg of manifest.packages) {
    const tarball = path.join(directory, pkg.filename);
    check(fs.lstatSync(tarball).isFile(), 'Package artifact must be a regular file');
    check(integrity(tarball) === pkg.integrity, `Artifact integrity mismatch for ${pkg.name}`);
    const names = exec('tar', ['-tzf', tarball])
      .trim()
      .split('\n')
      .map((name) => {
        check(name.startsWith('package/'), 'Unexpected tarball root');
        return name.slice('package/'.length);
      })
      .filter(Boolean);
    const packed = JSON.parse(exec('tar', ['-xOzf', tarball, 'package/package.json']));
    validatePackageFiles(names, packed);
    check(packed.version === pkg.version, 'Packed version differs from release manifest');
  }
  for (const [filename, expected] of Object.entries(manifest.files || {})) {
    check(['release.bundle', 'notes.md'].includes(filename), 'Unexpected manifest sidecar');
    check(
      integrity(path.join(directory, filename)) === expected,
      `Artifact integrity mismatch for ${filename}`
    );
  }
  check(
    manifest.files?.['release.bundle'] && manifest.files?.['notes.md'],
    'Missing release artifact sidecars'
  );
  return manifest;
}

function verifyReleaseCommit(manifest, directory) {
  exec('git', ['bundle', 'verify', path.join(directory, 'release.bundle')], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  exec('git', ['fetch', '--no-tags', path.join(directory, 'release.bundle'), 'HEAD']);
  check(
    exec('git', ['rev-parse', 'FETCH_HEAD']).trim() === manifest.releaseSha,
    'Bundle does not contain the release commit'
  );
  check(
    exec('git', ['rev-parse', `${manifest.releaseSha}^`]).trim() === manifest.sourceSha,
    'Release commit must have the validated source as its parent'
  );
  const changed = exec('git', ['diff', '--name-only', manifest.sourceSha, manifest.releaseSha])
    .trim()
    .split('\n')
    .filter(Boolean);
  const docs = manifest.documentationVersion;
  for (const file of changed) {
    check(
      adapter.versionFiles.includes(file) ||
        (docs &&
          (file === 'website/versions.json' ||
            file.startsWith(`website/versioned_docs/version-${docs}/`) ||
            file === `website/versioned_sidebars/version-${docs}-sidebars.json`)),
      `Unexpected release source change: ${file}`
    );
  }
  for (const file of adapter.versionFiles) {
    const before = JSON.parse(exec('git', ['show', `${manifest.sourceSha}:${file}`]));
    const after = JSON.parse(exec('git', ['show', `${manifest.releaseSha}:${file}`]));
    check(after.version === manifest.packages[0].version, `Release commit version mismatch in ${file}`);
    after.version = before.version;
    check(
      JSON.stringify(after) === JSON.stringify(before),
      `Release may only change the version in ${file}`
    );
  }
}

module.exports = { exec, integrity, validatePackageFiles, pack, readManifest, verifyReleaseCommit };
