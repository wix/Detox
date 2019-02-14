/* tslint:disable: no-console */
const exec = require('shell-utils').exec;
const semver = require('semver');

function tagVersion(packageVersion, currentPublished) {
  const tagName =
    semver.gt(packageVersion, currentPublished)
      ? `${packageVersion}-snapshot.${process.env.BUILD_ID}`
      : `${currentPublished}-snapshot.${process.env.BUILD_ID}`;

  gitTag(tagName);
}

function gitTag(newVersion) {
  // exec.execSync(`npm --no-git-tag-version version ${newVersion}`);
  // exec.execSync(`npm publish --tag ${VERSION_TAG}`);
  exec.execSync(`git tag -a ${newVersion} -m "${newVersion}"`);
  exec.execSyncSilent(`git push --tags deploy ${newVersion} || true`);
}

module.exports = tagVersion;
