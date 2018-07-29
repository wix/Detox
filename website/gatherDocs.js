#!/usr/bin/env node
const fs = require('fs-extra');
const git = require('nodegit');
const execSync = require('child_process').execSync;
const { major, lt } = require('semver');
const REPO_URL = 'https://github.com/wix/detox.git';

async function getVersions() {
  const tmp = fs.mkdtempSync('detox-versions');
  const repo = await git.Clone(REPO_URL, tmp);
  const tags = await git.Tag.list(repo);

  const semverTags = tags
    .filter((tag) => !tag.includes('@'))
    .filter((tag) => tag.split('.').length === 3 && major(tag) >= 7)
    .sort()
    .reverse();
  await fs.remove(tmp);
  return semverTags;
}

const sidebars = [];

async function cleanupExistingVersions() {
  console.log('Cleanup versioned docs');
  try {
    await fs.remove('./versions.json');
  } catch (err) {
    // that's OK
  }
  await fs.emptyDir('./versioned_docs');
  await fs.emptyDir('./versioned_sidebars');
}

// https://stackoverflow.com/a/46140283/1559386
function checkOutTag(repo, tag) {
  return git.Reference.dwim(repo, 'refs/tags/' + tag)
    .then(function(ref) {
      return ref.peel(git.Object.TYPE.COMMIT);
    })
    .then(function(ref) {
      return repo.getCommit(ref);
    })
    .then(function(commit) {
      return git.Checkout.tree(repo, commit, {
        checkoutStrategy: git.Checkout.STRATEGY.FORCE
      }).then(function() {
        return repo.setHeadDetached(commit, repo.defaultSignature, 'Checkout: HEAD ' + commit.id());
      });
    });
}

async function checkoutVersion(repo, version) {
  console.log('Checking out version', version);
  repo.cleanup();
  await checkOutTag(repo, version);
}

function fixMarkdownForPre7_3_4_versions(tempDir) {
  // We need to do this as we forgot the header in this one file, but added git tags with it included
  console.log('Temporary fix for Guide.DebuggingInXcode');
  const header = '---\nid: Guide.DebuggingInXcode\ntitle: Debugging in Xcode During Detox Tests\n---';
  execSync(`echo "${header}" | cat - Guide.DebuggingInXcode.md > /tmp/out && mv /tmp/out Guide.DebuggingInXcode.md`, {
    cwd: tempDir + '/docs'
  });
}

function fixVersionsFileForPre7_3_5_versions(tempDir) {
  console.log('Temporary fix for pages/en/versions.js');
  execSync(`cp ../../../../pages/en/versions.js .`, {
    cwd: tempDir + '/website/pages/en'
  });
}

function generateAndCopyDocusaurusVersion(tempDir, version) {
  console.log('Generating versioned doc for', version);
  execSync(`npm install && rm -f versions.json && rm -rf {versioned_docs,versioned_sidebars} && npm run version ${version}`, {
    cwd: tempDir + '/website'
  });

  console.log('Copy versioned doc');
  fs.copySync(`${tempDir}/website/versioned_docs/version-${version}`, `./versioned_docs/version-${version}`);

  console.log('Copy sidebar into versioned_sidebars');
  fs.copyFileSync(
    `${tempDir}/website/versioned_sidebars/version-${version}-sidebars.json`,
    `./versioned_sidebars/version-${version}-sidebars.json`
  );
}

async function generateDocumentation(versions, tempDir) {
  const repo = await git.Clone(REPO_URL, tempDir);

  for (let version of versions) {
    console.log('Clone repository into tmp directory');
    await checkoutVersion(repo, version);
    if (lt(version, '7.3.4')) {
      fixMarkdownForPre7_3_4_versions(tempDir);
    }

    if (lt(version, '7.3.6')) {
      fixVersionsFileForPre7_3_5_versions(tempDir);
    }
    generateAndCopyDocusaurusVersion(tempDir, version);
    repo.cleanup(tempDir);
    console.log(`Done with ${version}\n\n`);
  }
}

async function generate(versions, currentAttempt = 1) {
  const maxAttempts = 3;
  let success;
  const tempDir = fs.mkdtempSync('detox-documentation-generation');
  try {
    await generateDocumentation(versions, tempDir);
    success = true;
  } catch (e) {
    console.log('Error while generating documentation', e);
    success = false;
  } finally {
    await cleanUp(tempDir);
  }

  if (success) {
    return;
  }

  if (currentAttempt < maxAttempts) {
    await generate(versions, currentAttempt + 1);
  } else {
    console.error(`Generation failed ${maxAttempts} times, there seems to be a real problem, please file an issue`);
    process.exit(1);
  }
}

async function cleanUp(tempDir) {
  console.log('Cleanup temporary clone');
  await fs.remove(tempDir);
}

(async function() {
  const versions = await getVersions();
  await cleanupExistingVersions();
  fs.writeFileSync('./versions.json', JSON.stringify(versions), 'utf8');

  await generate(versions);
})();
