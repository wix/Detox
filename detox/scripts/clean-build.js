var shell = require('shelljs');

// this script fixes build troubleshooting issues with EarlGrey
// it should be run with: `node ./node_modules/detox/scripts/clean-build.js`
// from the project root (where package.json is)

shell.exec('rm -f ios.tar');

shell.echo('\n#################################################################');
shell.echo('# deleting node_modules/detox/ios/EarlGrey/OCHamcrest.framework');
shell.rm('-rf', './node_modules/detox/ios/EarlGrey/OCHamcrest.framework');

shell.echo('\n#################################################################');
shell.echo('# deleting node_modules/detox/ios/EarlGrey/fishhook');
shell.rm('-rf', './node_modules/detox/ios/EarlGrey/fishhook');

shell.echo('\n#################################################################');
shell.echo('# deleting node_modules/detox/ios/EarlGrey/Tests/UnitTests/ocmock');
shell.rm('-rf', './node_modules/detox/ios/EarlGrey/Tests/UnitTests/ocmock');

shell.echo('\n');
