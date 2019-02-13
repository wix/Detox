/* tslint:disable: no-console */
const _ = require('lodash');
const exec = require('shell-utils').exec;
const semver = require('semver');
const fs = require('fs');
const path = require('path');

const isRelease = (process.env.RELEASE_VERSION_TYPE && process.env.RELEASE_VERSION_TYPE !== 'none');

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
	log('Preparing to tag/release');

	const packageVersion = getVersion();
	log(`    package version: ${packageVersion}`);

	const currentPublished = findCurrentPublishedVersion();
	log(`    current published version: ${currentPublished}`);

	if (isRelease) {
		tryPublishNewVersion(packageVersion);
	} else {
		log('TODO tag a snapshot')
		// tryPublishAndTag(packageVersion, currentPublished);
	}

	log(`Over and out`);
}

function findCurrentPublishedVersion() {
	return exec.execSyncRead(`npm view detox dist-tags.latest`);
}

function tryPublishNewVersion(packageVersion) {
	log('Publishing using lerna...');
	validatePublishConfig();

	const versionType = process.env.RELEASE_VERSION_TYPE;
	const lernaResult = exec.execSyncRead(`lerna publish --cd-version "${versionType}" --yes --skip-git`);
	log('Result from Lerna:', lernaResult);
	const newVersion = getVersion();
	if (newVersion === packageVersion) {
		log('Stopping: Lerna\'s completed without upgrading the version');
		return;
	}

	log('Starting changelog generator...');
	exec.execSync(`github_changelog_generator --future-release "${newVersion}" --no-verbose`);

	log('Packing up into a git commit...');
	exec.execSync(`git add -A`);
	exec.execSync(`git commit -m "[skip ci] Publish $VERSION"`);
	exec.execSync(`git tag ${newVersion}`);
	exec.execSync(`git push deploy`);
	exec.execSync(`git push --tags deploy`);
}

function validatePublishConfig() {
	const lernaVersion = exec.execSyncRead('lerna --version');
	if (!lernaVersion.startsWith('2.')) {
		throw new Error(`Cannot publish: lerna version isn't 2.x.x (actual version is ${lernaVersion})`);
	}

	const changelogGenerator = exec.execSyncRead(`which github_changelog_generator`);
	if (!changelogGenerator) {
		throw new Error(`Cannot publish: Github change-log generator not installed (see https://github.com/github-changelog-generator/github-changelog-generator#installation for more details`);
	}

	if (!process.env.CHANGELOG_GITHUB_TOKEN) {
		throw new Error(`Cannot publish: Github token for change-log generator hasn't been specified (see https://github.com/github-changelog-generator/github-changelog-generator#github-token for more details)`);
	}
}

function tryPublishAndTag(packageVersion, currentPublished) {
	let theCandidate =
		semver.gt(packageVersion, currentPublished)
			? `${packageVersion}-snapshot.${process.env.BUILD_ID}`
			: `${currentPublished}-snapshot.${process.env.BUILD_ID}`;

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
	// if (isRelease) {
	// 	updatePackageJsonGit(newVersion);
	// }
}

function getVersion() {
	const version = semver.clean(require('../detox/package.json').version);
	if (!version) {
		throw new Error('Error: failed to read version from package.json!');
	}
	return version;
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
