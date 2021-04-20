const fs = require('fs-extra');
const { execSync } = require('child_process');

function resolveSelectedConfiguration() {
  const { configurations } = require('./detox.config.js');
  const configName = process.env.DETOX_CONFIGURATION;
  return configurations[configName];
}

function downloadTestButlerAPKIfNeeded() {
  const version = '2.2.1';
  const artifactUrl = `https://repo1.maven.org/maven2/com/linkedin/testbutler/test-butler-app/${version}/test-butler-app-${version}.apk`;
  const filePath = `./cache/test-butler-app.apk`;
  fs.ensureDirSync('./cache');
  if (!fs.existsSync(filePath)) {
    console.log(`\nDownloading Test-Butler APK v${version}...`);
    execSync(`curl -f -o ${filePath} ${artifactUrl}`);
  }
}

async function globalSetup() {
  const config = resolveSelectedConfiguration() || {};
  if ([config.type, process.env.DETOX_CONFIGURATION, config.device].some(s => `${s}`.includes('android'))) {
    downloadTestButlerAPKIfNeeded();
  }

  const detox = require('detox');
  await detox.globalInit();
}

module.exports = globalSetup;
