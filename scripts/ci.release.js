/* tslint:disable: no-console */
const exec = require('shell-utils').exec;
const fs = require('fs');
const {log, logSection, getVersionSafe, releaseNpmTag, getIsRelease, getPackagesFromPreviousBuilds} = require('./ci.common');

const isRelease = getIsRelease();

function run() {
	logSection('Script started');
	if (!isEnvValid()) {
		return;
	}

	log('Configuring stuff...');
	setupGitConfig();
	setupNpmConfig();
	getPackagesFromPreviousBuilds();
	versionTagAndPublish();
}

function isEnvValid() {
	if (!process.env.CI) {
		throw new Error(`Release blocked: Not on a CI build machine!`);
	}
	return true;
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
}

function versionTagAndPublish() {
	logSection('Preparing to tag/release');

	const packageVersion = getVersionSafe();
	log(`    package version: ${packageVersion}`);

	const currentPublished = findCurrentPublishedVersion();
	log(`    current published version from ${process.env.BUILDKITE_BRANCH}: ${currentPublished}`);

	if (isRelease) {
		const publishNewVersion = require('./ci.publish');
		publishNewVersion(releaseNpmTag());
	} else {
		// Disabled for the time being
		// const tagVersion = require('./ci.tagversion');
		// tagVersion(packageVersion, currentPublished);
	}

	log(`Great success, much amaze`);
}


function findCurrentPublishedVersion() {
	return exec.execSyncRead(`npm view detox dist-tags.${releaseNpmTag()}`);
}

run();
