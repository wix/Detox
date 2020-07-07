const fs = require('fs-extra');
const { execSync } = require('child_process');
const argv = require('minimist')(process.argv.slice(2));
const rawConfig = require('./detox.config-raw.json');

function resolveSelectedConfiguration() {
  const configName = argv['c'] || argv['configuration']; // Hack-ish, until we refactor Detox for a true global init
  return configName && rawConfig.configurations[configName];
}

function downloadTestButlerAPKIfNeeded() {
  const version = '2.1.0';
  const artifactUrl = `https://linkedin.bintray.com/maven/com/linkedin/testbutler/test-butler-app/${version}/test-butler-app-${version}.apk`;
  const filePath = './cache/test-butler-app.apk';
  fs.ensureDirSync('./cache');
  if (!fs.existsSync(filePath)) {
    console.log('Downloading Test-Butler APK...');
    execSync(`curl -f -o ${filePath} ${artifactUrl}`);
  }
}

function getConfiguration() {
  try {
    const actualConfig = resolveSelectedConfiguration();
    if (actualConfig && actualConfig.type.includes('android')) {
      downloadTestButlerAPKIfNeeded();
    }
  } catch (e) {
    throw new Error('Failed to download test-butler APK');
  }
  return rawConfig;
}

module.exports = getConfiguration();
