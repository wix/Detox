/* tslint:disable: no-console */
const cp = require('child_process');
const exec = require('shell-utils').exec;
const fs = require('fs');
const path = require('path');

const MAX_PUBLISH_RETRIES = 5;

/** Default; override with GITHUB_REPOSITORY (owner/repo) on CI if needed. */
function getGithubRepoSlug() {
  if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_REPOSITORY.includes('/')) {
    return process.env.GITHUB_REPOSITORY.trim();
  }
  return 'wix/Detox';
}

const {
  log,
  logSection,
  getReleaseNpmTag,
  getReleaseVersionType,
  getVersionSafe,
  isDryRun,
  isSkipNpm
} = require('./releaseArgs');

const {removeDocsForVersion, buildDocsForVersion} = require('./releaseDocumentation');

function publishNewVersion() {
  validatePrerequisites();
  projectSetup();

  const releaseTag = getReleaseNpmTag();
  const currentVersion = queryNpmVersionByTag(releaseTag);
  log(`    current published version on tag ${releaseTag}: ${currentVersion || 'N/A'}`);

  publishToNpm(releaseTag);

  const newVersion = getVersionSafe();
  log(`    new published version on tag ${releaseTag}: ${newVersion}`);

  if (releaseTag === 'latest') {
    releaseDocsVersion(newVersion, currentVersion);
  }
}

function validatePrerequisites() {
  const yarnVersion = exec.execSyncRead('yarn --version').trim();
  if (!yarnVersion.startsWith('4')) {
    throw new Error(`Cannot publish: Yarn 4.x required, got ${yarnVersion}`);
  }
}

function getPublishablePackages() {
  const output = exec.execSyncRead('yarn workspaces list --json --no-private');
  return output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line).location);
}

function getRootVersion() {
  const rootPkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  return rootPkg.version;
}

function syncWorkspaceVersions(packages, version) {
  for (const pkg of packages) {
    const pkgPath = path.join(process.cwd(), pkg, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkgJson.version = version;
      fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2) + '\n');
    }
  }
}

/** Primary npm package name used to detect "version already published" (matches RNN release.js pattern). */
function getPrimaryNpmPackageName() {
  const detoxPkgPath = path.join(process.cwd(), 'detox', 'package.json');
  const pkgJson = JSON.parse(fs.readFileSync(detoxPkgPath, 'utf8'));
  return pkgJson.name;
}

function tryPublishWorkspaces(packages, npmTag) {
  const registryPackageName = getPrimaryNpmPackageName();

  for (let i = 0; i < MAX_PUBLISH_RETRIES; i++) {
    try {
      for (const pkg of packages) {
        const v = getRootVersion();
        log(`Publishing ${pkg}@${v} with tag ${npmTag}`);
        exec.execSync(`cd ${pkg} && npm publish --tag ${npmTag}`);
      }
      return;
    } catch (err) {
      const version = getRootVersion();
      let alreadyPublished = false;
      try {
        cp.execSync(`npm view ${registryPackageName}@${version} version`, {stdio: 'pipe'});
        alreadyPublished = true;
      } catch (_) {
        alreadyPublished = false;
      }
      if (!alreadyPublished) {
        throw err;
      }
      log(
        `Version ${version} is already on npm; bumping patch in package.json files and retrying publish...`
      );
      exec.execSync(`npm version patch --no-git-tag-version`);
      const bumped = getRootVersion();
      syncWorkspaceVersions(packages, bumped);
    }
  }

  throw new Error(`npm publish failed after ${MAX_PUBLISH_RETRIES} attempts (including retries)`);
}

/**
 * Same pattern as react-native-navigation scripts/release.js: push release tag, then open a PR
 * with package.json bumps (no direct push of version commits to the base branch).
 */
function updatePackageJsonViaPR(version, packages) {
  logSection('Open PR for package.json version bump');
  const branch = process.env.BUILDKITE_BRANCH;
  const prBranch = `ci/update-version-${version}`;

  exec.execSync(`git checkout ${branch}`);
  exec.execSync(`git checkout -b ${prBranch}`);

  const npmrcPath = path.join(process.cwd(), '.npmrc');
  if (fs.existsSync(npmrcPath)) {
    fs.unlinkSync(npmrcPath);
    log('Removed .npmrc before commit');
  }

  const pkgJsonPaths = [path.join(process.cwd(), 'package.json')];
  for (const pkg of packages) {
    const pkgJsonPath = path.join(process.cwd(), pkg, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      pkgJsonPaths.push(pkgJsonPath);
    }
  }

  for (const p of pkgJsonPaths) {
    exec.execSync(`git add "${p}"`);
  }

  exec.execSync(`git commit -m "Update package.json version to ${version} [buildkite skip]"`);
  exec.execSync(`git push origin ${prBranch}`);

  const repo = getGithubRepoSlug();
  const prPayload = {
    title: `Update package.json version to ${version}`,
    head: prBranch,
    base: branch,
    body: `Automated version bump to ${version} from CI release.`,
  };
  const prData = JSON.stringify(prPayload);

  cp.execSync(
    `curl -s -S -f -X POST ` +
      `-H "Authorization: token ${process.env.GIT_TOKEN}" ` +
      `-H "Content-Type: application/json" ` +
      `-d '${prData}' ` +
      `https://api.github.com/repos/${repo}/pulls`,
    {stdio: 'inherit'}
  );

  log(`Opened PR: ${prBranch} -> ${branch} (${repo})`);
}

function projectSetup() {
  logSection('Project setup');
  exec.execSync(`git checkout ${process.env.BUILDKITE_BRANCH}`);
}

function createNpmRc() {
  const content = `
email=\${NPM_EMAIL}
//registry.npmjs.org/:_authToken=\${NPM_TOKEN}
`;
  fs.writeFileSync('.npmrc', content);
  log('Created .npmrc for npm authentication');
}

function publishToNpm(npmTag) {
  logSection('Yarn publish');
  const versionType = getReleaseVersionType();
  const dryRun = isDryRun();
  const skipNpm = isSkipNpm();

  if (dryRun) {
    log('DRY RUN: Publishing without pushing to NPM');
  } else if (skipNpm) {
    log('SKIP NPM is set: Skipping NPM publish');
  }

  // Bump version in root package.json using npm (supports --preid unlike yarn 4)
  const preid = versionType.includes("pre") ? `--preid=${npmTag}` : '';
  exec.execSync(`npm version ${versionType} ${preid} --no-git-tag-version`);

  const packages = getPublishablePackages();
  const newVersion = getRootVersion();
  log(`Publishing version ${newVersion} for packages: ${packages.join(', ')}`);

  syncWorkspaceVersions(packages, newVersion);

  if (!dryRun && !skipNpm) {
    createNpmRc();
    tryPublishWorkspaces(packages, npmTag);
  }

  const publishedVersion = getRootVersion();

  if (!dryRun) {
    exec.execSync(`git tag -a ${publishedVersion} -m "${publishedVersion}"`);
    exec.execSyncSilent(`git push origin ${publishedVersion}`);

    updatePackageJsonViaPR(publishedVersion, packages);
  }
}

function releaseDocsVersion(newVersion, previousVersion) {
  const newDocsVersion = newVersion.split('.', 1).concat('.x').join('');
  const previousDocsVersion = previousVersion.split('.', 1).concat('.x').join('');

  if (newDocsVersion === previousDocsVersion) {
    removeDocsForVersion(previousDocsVersion);
  }

  buildDocsForVersion(newDocsVersion);
}

function queryNpmVersionByTag(npmTag) {
  return exec.execSyncRead(`npm view detox dist-tags.${npmTag}`).trim();
}

module.exports = publishNewVersion;
