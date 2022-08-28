const shellUtils = require('shell-utils');
const exec = shellUtils.exec;
const fs = require('fs');
const includes = require('lodash/includes');

const docsPath = `${process.cwd()}/website`;
const docsVersionsJsonPath = `${docsPath}/versions.json`;

function buildDocsForVersion(version) {
  console.log(`Publishing documentation version: ${version}.`);
  const originalDir = process.cwd();

  try {
    process.chdir(docsPath);
    exec.execSync(`npm install`);
    exec.execSync(`npm run docusaurus docs:version ${version}`);
    exec.execSync(`git add .`);
    exec.execSync(`git diff --staged --quiet || git commit -m "Publish docs version ${version}"`);
    exec.execSync(`git push origin ${process.env.BUILDKITE_BRANCH}`);
  } finally {
    process.chdir(originalDir);
  }
}

function removeDocsForVersion(version) {
  if (!_isVersionExists(version)) {
    console.log(`Version ${version} does not exist.`);
    return;
  }

  console.log(`Removing documentation version: ${version}.`);
  exec.execSync(`rm -rf ${docsPath}/versioned_docs/version-${version}`);
  exec.execSync(`rm -f ${docsPath}/versioned_sidebars/version-${version}-sidebars.json`);
  const versions = _readDocsVersions();
  versions.splice(versions.indexOf(version), 1);
  _updateDocsVersionsFile(versions);
}

function _isVersionExists(version) {
  console.log(`Check if version exists: ${version}.`);
  const versions = _readDocsVersions();
  return includes(versions, version);
}

function _readDocsVersions() {
  if (fs.existsSync(docsVersionsJsonPath)) {
    return JSON.parse(fs.readFileSync(docsVersionsJsonPath));
  } else {
    console.log(`Versions file (${docsVersionsJsonPath}) does not exist.`);
    return [];
  }
}

function _updateDocsVersionsFile(versions) {
  fs.writeFileSync(docsVersionsJsonPath, JSON.stringify(versions, null, 2));
}

module.exports = {
  buildDocsForVersion,
  removeDocsForVersion
};
