/* tslint:disable: no-console */
const _ = require('lodash');
const exec = require('shell-utils').exec;
const semver = require('semver');
const fs = require('fs');
const path = require('path');

// Workaround JS
const isRelease = process.env.RELEASE_BUILD === 'true';

const ONLY_ON_BRANCH = 'origin/master';
const VERSION_TAG = isRelease ? 'latest' : 'snapshot';
const VERSION_INC = 'patch';

const log = (...args) => console.log('[RELEASE]', ...args);

function run() {
	log('DEBUG!!!', process.env);

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
email=\${NPM_EMAIL}
//registry.npmjs.org/:_authToken=\${NPM_TOKEN}
`;
	fs.writeFileSync(`.npmrc`, content);
}

function versionTagAndPublish() {
	const packageVersion = semver.clean(process.env.npm_package_version);
	console.log(`package version: ${packageVersion}`);

	// const currentPublished = findCurrentPublishedVersion();
	// console.log(`current published version: ${currentPublished}`);
	//
	// const version = isRelease
	// 	? process.env.VERSION
	// 	: semver.gt(packageVersion, currentPublished)
	// 		? `${packageVersion}-snapshot.${process.env.BUILD_ID}`
	// 		: `${currentPublished}-snapshot.${process.env.BUILD_ID}`;
	//
	// console.log(`Publishing version: ${version}`);
	//
	// tryPublishAndTag(version);
}

function findCurrentPublishedVersion() {
	return exec.execSyncRead(`npm view ${process.env.npm_package_name} dist-tags.latest`);
}

function tryPublishAndTag(version) {
	let theCandidate = version;
	for (let retry = 0; retry < 5; retry++) {
		try {
			tagAndPublish(theCandidate);
			console.log(`Released ${theCandidate}`);
			return;
		} catch (err) {
			const alreadyPublished = _.includes(err.toString(), 'You cannot publish over the previously published version');
			if (!alreadyPublished) {
				throw err;
			}
			console.log(`previously published. retrying with increased ${VERSION_INC}...`);
			theCandidate = semver.inc(theCandidate, VERSION_INC);
		}
	}
}

function tagAndPublish(newVersion) {
	console.log(`trying to publish ${newVersion}...`);
	exec.execSync(`npm --no-git-tag-version version ${newVersion}`);
	exec.execSync(`npm publish --tag ${VERSION_TAG}`);
	exec.execSync(`git tag -a ${newVersion} -m "${newVersion}"`);
	exec.execSyncSilent(`git push deploy ${newVersion} || true`);
	if (isRelease) {
		updatePackageJsonGit(newVersion);
	}
}

function getPackageJsonPath() {
	return `${process.cwd()}/package.json`;
}

function writePackageJson(packageJson) {
	fs.writeFileSync(getPackageJsonPath(), JSON.stringify(packageJson, null, 2));
}

function readPackageJson() {
	return JSON.parse(fs.readFileSync(getPackageJsonPath()));
}

function updatePackageJsonGit(version) {
	exec.execSync(`git checkout master`);
	const packageJson = readPackageJson();
	packageJson.version = version;
	writePackageJson(packageJson);
	exec.execSync(`git add package.json`);
	exec.execSync(`git commit -m"Update package.json version to ${version} [ci skip]"`);
	exec.execSync(`git push deploy master`);
}

run();
