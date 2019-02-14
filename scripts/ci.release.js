/* tslint:disable: no-console */
const _ = require('lodash');
const exec = require('shell-utils').exec;
const semver = require('semver');
const fs = require('fs');

const isRelease = (process.env.RELEASE_VERSION_TYPE && process.env.RELEASE_VERSION_TYPE !== 'none');

const ONLY_ON_BRANCH = 'origin/master';

const log = (...args) => console.log('[RELEASE]', ...args);

function run() {
	if (!validateEnv()) {
		return;
	}
	setupGitConfig();
	setupNpmConfig();
	versionTagAndPublish();
}

function validateEnv() {
	if (!process.env.JENKINS_CI) {
		throw new Error(`Release blocked: Not on a CI build machine!`);
	}

	if (!process.env.JENKINS_MASTER) {
		log(`Release blocked: Not on jenkins' master build job!`);
		return false;
	}

	if (process.env.GIT_BRANCH !== ONLY_ON_BRANCH) {
		log(`Release blocked: Not publishing on branch ${process.env.GIT_BRANCH}, which isn't ${ONLY_ON_BRANCH}`);
		return false;
	}

	return true;
}

function setupGitConfig() {
	exec.execSyncSilent(`git config --global push.default simple`);
	exec.execSyncSilent(`git config --global user.email "${process.env.GIT_EMAIL}"`);
	exec.execSyncSilent(`git config --global user.name "${process.env.GIT_USER}"`);
	const remoteUrl = new RegExp(`https?://(\\S+)`).exec(exec.execSyncRead(`git remote -v`))[1];
	exec.execSyncSilent(`git remote add deploy "https://${process.env.GIT_USER}:${process.env.GIT_TOKEN}@${remoteUrl}"`);
	// exec.execSync(`git checkout ${ONLY_ON_BRANCH}`);
}

function setupNpmConfig() {
	exec.execSync(`rm -f package-lock.json`);
	const content = `
email=\${process.env.NPM_EMAIL}
//registry.npmjs.org/:_authToken=\${process.env.NPM_EMAIL}
`;
	fs.writeFileSync(`.npmrc`, content);

	// Workaround. see https://github.com/lerna/lerna/issues/361
	fs.copyFileSync('.npmrc', 'detox/.npmrc');
	fs.copyFileSync('.npmrc', 'detox-cli/.npmrc');
}

function versionTagAndPublish() {
	log('Preparing to tag/release');

	const packageVersion = getVersion();
	log(`    package version: ${packageVersion}`);

	const currentPublished = findCurrentPublishedVersion();
	log(`    current published version: ${currentPublished}`);

	if (isRelease) {
		const publishNewVersion = require('./ci.publish');
		publishNewVersion(packageVersion);
	} else {
		const tagVersion = require('./ci.tagversion');
		tagVersion(packageVersion, currentPublished);
	}

	log(`Great success, much amaze`);
}

function findCurrentPublishedVersion() {
	return exec.execSyncRead(`npm view detox dist-tags.latest`);
}

function getVersion() {
	const version = semver.clean(require('../detox/package.json').version);
	if (!version) {
		throw new Error('Error: failed to read version from package.json!');
	}
	return version;
}

run();
