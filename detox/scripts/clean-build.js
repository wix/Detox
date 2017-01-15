require('shelljs/global');
require('./logger');

// this script fixes build troubleshooting issues with EarlGrey
// it should be run with: `node ./node_modules/detox/scripts/clean-build.js`
// from the project root (where package.json is)

exec('rm -f Detox.framework.tar');

console.step('deleting node_modules/detox/ios/EarlGrey/OCHamcrest.framework');
rm('-rf', './node_modules/detox/ios/EarlGrey/OCHamcrest.framework');

console.step('deleting node_modules/detox/ios/EarlGrey/fishhook');
rm('-rf', './node_modules/detox/ios/EarlGrey/fishhook');

console.step('# deleting node_modules/detox/ios/EarlGrey/Tests/UnitTests/ocmock');
rm('-rf', './node_modules/detox/ios/EarlGrey/Tests/UnitTests/ocmock');
