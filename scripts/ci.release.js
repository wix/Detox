/* tslint:disable: no-console */
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
