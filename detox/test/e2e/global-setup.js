const fs = require('fs-extra');
const { execSync } = require('child_process');

function resolveSelectedConfiguration() {
  const { configurations } = require('../detox.config.js');
  const configName = process.env.DETOX_CONFIGURATION;
  return configurations[configName];
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
