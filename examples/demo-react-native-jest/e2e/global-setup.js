const fs = require('fs-extra');
const { execSync } = require('child_process');
const { globalSetup } = require('detox/runners/jest');
const { config } = require('detox/internals');

async function customGlobalSetup() {
  await globalSetup();

  if (config.device.type === 'android.emulator') {
    downloadTestButlerAPK();
  }
}

function downloadTestButlerAPK() {
  const version = '2.2.1';
  const artifactUrl = `https://repo1.maven.org/maven2/com/linkedin/testbutler/test-butler-app/${version}/test-butler-app-${version}.apk`;
  const filePath = `./cache/test-butler-app.apk`;

  fs.ensureDirSync('./cache');
  if (!fs.existsSync(filePath)) {
    console.log(`\nDownloading Test-Butler APK v${version}...`);
    execSync(`curl -f -o ${filePath} ${artifactUrl}`);
  }
}

module.exports = customGlobalSetup;
