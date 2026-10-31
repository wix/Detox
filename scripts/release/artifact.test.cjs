const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const adapter = require('./detox.cjs');
const { exec, integrity, validatePackageFiles, verifyReleaseCommit } = require('./artifact.cjs');

const [detox, cli] = adapter.packages;
const files = detox.requiredFiles('8.9.0');
const pkg = {
  name: detox.name,
  version: '8.9.0',
  repository: { url: `https://github.com/${adapter.repository}.git` },
  main: './index.js',
  types: './index.d.ts',
  bin: 'local-cli/cli.js',
};

test('package checks include entry points, native artifacts, and accidental credentials', () => {
  validatePackageFiles(files, pkg);
  validatePackageFiles(['package.json', 'cli.js'], {
    ...pkg,
    name: cli.name,
    main: 'cli.js',
    types: undefined,
    bin: { detox: './cli.js' },
  });
  for (const native of ['Detox-ios-framework.tbz', 'Detox-android/com/wix/detox/8.9.0/detox-8.9.0.aar'])
    assert.throws(() => validatePackageFiles(files.filter((f) => f !== native), pkg), /missing/);
  assert.throws(
    () => validatePackageFiles(files, { ...pkg, version: '8.9.1' }),
    /missing Detox-android/
  );
  assert.throws(
    () => validatePackageFiles(files, { ...pkg, types: './missing.d.ts' }),
    /Unresolvable/
  );
  assert.throws(() => validatePackageFiles(files, { ...pkg, name: 'other' }), /Unexpected/);
  assert.throws(
    () => validatePackageFiles(files, { ...pkg, repository: { url: 'git+https://github.com/wix/detox.git' } }),
    /repository/
  );
  for (const bad of [
    'android/.gradle/cache',
    '.npmrc',
    'ios/key.keystore',
    'test/e2e/index.js',
    'build_temp_xcuitest/Runner.xctestrun',
    '../escape',
  ]) {
    assert.throws(() => validatePackageFiles([...files, bad], pkg));
  }
});

test('integrity detects changes to saved package bytes', () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'detox-integrity-'));
  try {
    const file = path.join(folder, 'package.tgz');
    fs.writeFileSync(file, 'original');
    const first = integrity(file);
    fs.writeFileSync(file, 'changed');
    assert.notEqual(integrity(file), first);
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
});

test('real git bundles permit only the recorded version change on the validated source', () => {
  const previousCwd = process.cwd();
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'detox-release-git-'));
  try {
    process.chdir(folder);
    exec('git', ['init', '-q']);
    exec('git', ['config', 'user.name', 'Release test']);
    exec('git', ['config', 'user.email', 'release@example.test']);
    const write = (version) => {
      for (const file of adapter.versionFiles) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, JSON.stringify({ name: file, version }));
      }
    };
    write('1.0.0');
    exec('git', ['add', '.']);
    exec('git', ['commit', '-qm', 'source']);
    const sourceSha = exec('git', ['rev-parse', 'HEAD']).trim();
    write('1.0.1');
    exec('git', ['commit', '-qam', 'version']);
    const releaseSha = exec('git', ['rev-parse', 'HEAD']).trim();
    exec('git', ['bundle', 'create', 'release.bundle', 'HEAD', `^${sourceSha}`]);
    verifyReleaseCommit({ sourceSha, releaseSha, packages: [{ version: '1.0.1' }] }, folder);
    fs.mkdirSync('website/versioned_docs/version-1.x', { recursive: true });
    fs.writeFileSync('website/versioned_docs/version-1.x/intro.md', 'docs');
    exec('git', ['add', 'website']);
    exec('git', ['commit', '--amend', '-qm', 'version and docs']);
    const docsSha = exec('git', ['rev-parse', 'HEAD']).trim();
    exec('git', ['bundle', 'create', 'release.bundle', 'HEAD', `^${sourceSha}`]);
    const docsManifest = { sourceSha, releaseSha: docsSha, packages: [{ version: '1.0.1' }] };
    verifyReleaseCommit({ ...docsManifest, documentationVersion: '1.x' }, folder);
    assert.throws(
      () => verifyReleaseCommit({ ...docsManifest, documentationVersion: '2.x' }, folder),
      /Unexpected release source change/
    );
    fs.writeFileSync('runtime.js', 'unexpected code');
    exec('git', ['add', 'runtime.js']);
    exec('git', ['commit', '--amend', '-qm', 'unexpected mutation']);
    const changedSha = exec('git', ['rev-parse', 'HEAD']).trim();
    exec('git', ['bundle', 'create', 'release.bundle', 'HEAD', `^${sourceSha}`]);
    assert.throws(
      () =>
        verifyReleaseCommit(
          { sourceSha, releaseSha: changedSha, packages: [{ version: '1.0.1' }] },
          folder
        ),
      /Unexpected release source change/
    );
  } finally {
    process.chdir(previousCwd);
    fs.rmSync(folder, { recursive: true, force: true });
  }
});
