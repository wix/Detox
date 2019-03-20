const path = require('path');
const cp = require('child_process');
const log = require('../src/utils/logger').child({ __filename: 'detox-build-framework-cache' });
const catchAndLog = require('./utils/catchAndLog');

module.exports.command = 'build-framework-cache';
module.exports.desc = 'Build Detox.framework to ~/Library/Detox. The framework cache is specific for each combination of Xcode and Detox versions';

module.exports.handler = catchAndLog(log, function () {
  cp.execSync(path.join(__dirname, '../scripts/build_framework.ios.sh'), {stdio: 'inherit'});
});
