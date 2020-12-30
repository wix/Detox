const fs = require('fs-extra');
const { execSync } = require('child_process');

// Warning: internal API! this will be fixed when Detox allows for a global init, thus providing us
// with a working device.getPlatform() we could use.
const argparse = require('../../src/utils/argparse');

function resolveSelectedConfiguration() {
  const rawConfig = require('../package.json').detox;
  const configName = argparse.getArgValue('configuration');
  return rawConfig.configurations[configName];
}

function downloadTestButlerAPKIfNeeded() {
  const version = '2.1.0';
  const artifactUrl = `https://linkedin.bintray.com/maven/com/linkedin/testbutler/test-butler-app/${version}/test-butler-app-${version}.apk`;
  const filePath = './cache/test-butler-app.apk';
  fs.ensureDirSync('./cache');
  if (!fs.existsSync(filePath)) {
    console.log('\nDownloading Test-Butler APK...');
    execSync(`curl -f -o ${filePath} ${artifactUrl}`);
  }
}

async function globalSetup() {
  const config = resolveSelectedConfiguration();
  if (config && config.type.includes('android')) {
    downloadTestButlerAPKIfNeeded();
  }

  const detox = require('detox');
  await detox.globalInit();
}

module.exports = globalSetup;
