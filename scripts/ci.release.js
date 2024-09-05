/* tslint:disable: no-console */
const fs = require('fs');
const {exec} = require('shell-utils');

const {
  log, logSection, isRelease, getPackagesFromPreviousBuilds
} = require('./utils/releaseArgs');
const publishNewVersion = require('./utils/publishNewVersion');

function run() {
  logSection('Script started');
  assertCI();

  log('Configuring stuff...');
  setupGitConfig();
  setupNpmConfig();
  getPackagesFromPreviousBuilds();
  versionTagAndPublish();
}

function assertCI() {
  if (!process.env.CI) {
    throw new Error(`Release blocked: Not on a CI build machine!`);
  }
}

function setupGitConfig() {
  exec.execSyncSilent(`git config --global push.default simple`);
  exec.execSyncSilent(`git config --global user.email "${process.env.GIT_EMAIL}"`);
  exec.execSyncSilent(`git config --global user.name "${process.env.GIT_USER}"`);
  const remoteUrl = new RegExp(`https?://(\\S+)`).exec(exec.execSyncRead(`git remote -v`))[1];
  exec.execSyncSilent(`git remote set-url origin "https://${process.env.GIT_USER}:${process.env.GIT_TOKEN}@${remoteUrl}"`);
}

function setupNpmConfig() {
  exec.execSync(`rm -f package-lock.json`);
  const content = `
email=\${NPM_EMAIL}
//registry.npmjs.org/:_authToken=\${NPM_TOKEN}
`;
  fs.writeFileSync(`.npmrc`, content);

  // Workaround. see https://github.com/lerna/lerna/issues/361
  fs.copyFileSync('.npmrc', 'detox/.npmrc');
  fs.copyFileSync('.npmrc', 'detox-cli/.npmrc');
  fs.copyFileSync('.npmrc', 'detox-copilot/.npmrc');
}

function versionTagAndPublish() {
  logSection('Preparing to tag/release');

  if (isRelease()) {
    publishNewVersion();
    log(`Great success, much amaze`);
  } else {
    log(`Skipping release...`);
  }
}

run();
