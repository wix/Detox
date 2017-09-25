const os = require('os');
const path = require('path');
const exec = require('child-process-promise').exec;

function getDetoxVersion() {
  return require(path.join(__dirname, '../../package.json')).version;
}

async function getFrameworkPath() {
  const detoxVersion = this.getDetoxVersion();
  const sha1 = (await exec(`(echo "${detoxVersion}" && xcodebuild -version) | shasum | awk '{print $1}'`)).stdout.trim();
  return `${os.homedir()}/Library/Detox/ios/${sha1}/Detox.framework`;
}

module.exports = {
  getDetoxVersion,
  getFrameworkPath
};
