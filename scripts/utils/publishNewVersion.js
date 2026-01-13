/* tslint:disable: no-console */
const exec = require('shell-utils').exec;
const fs = require('fs');
const path = require('path');

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

  const rootPkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  const newVersion = rootPkg.version;

  // Update versions in workspace packages
  const packages = getPublishablePackages();
  log(`Publishing version ${newVersion} for packages: ${packages.join(', ')}`);

  for (const pkg of packages) {
    const pkgPath = path.join(process.cwd(), pkg, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkgJson.version = newVersion;
      fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2) + '\n');
    }
  }

  if (!dryRun && !skipNpm) {
    createNpmRc();
    // Publish each public package
    for (const pkg of packages) {
      log(`Publishing ${pkg}@${newVersion} with tag ${npmTag}`);
      exec.execSync(`cd ${pkg} && npm publish --tag ${npmTag}`);
    }
  }

  // Git operations
  if (!dryRun) {
    exec.execSync(`git add -A`);
    exec.execSync(`git commit -m "Publish ${newVersion} [ci skip]"`);
    exec.execSync(`git tag ${newVersion}`);
    exec.execSync(`git push`);
    exec.execSync(`git push --tags`);
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
