var shell = require('shelljs');

shell.echo('\n#################################################################');
shell.echo('# npm run build');
if (shell.exec('npm run build', {silent: true}).code !== 0) {
  shell.echo('error: npm run build');
  process.exit(1);
}

shell.echo('\n#################################################################');
shell.echo('# cd test');
shell.cd('test');

shell.echo('\n#################################################################');
shell.echo('# npm install');
if (shell.exec('npm install').code !== 0) {
  shell.echo('error: npm install');
  process.exit(1);
}

shell.echo('\n#################################################################');
if (!shell.exec('netstat -n -atp tcp | grep -i "listen" | grep ".8099"', {silent: true}).stdout) {
  shell.echo('# detox-server is not running, run it');
  if (shell.exec('../node_modules/.bin/ttab -w node ./node_modules/.bin/detox-server').code !== 0) {
    shell.echo('# error: cannot run detox-server in a new tab');
    process.exit(1);
  }
} else {
  shell.echo('# detox-server is already running');
}

shell.echo('\n#################################################################');
shell.echo('# killing any running react-native packagers');
shell.exec('pkill -f "react-native/packager" ; pkill -f "react-native start"');

shell.echo('\n#################################################################');
shell.echo('# node ./node_modules/detox/scripts/clean-build.js');
if (shell.exec('node ./node_modules/detox/scripts/clean-build.js').code !== 0) {
  shell.echo('error: node ./node_modules/detox/scripts/clean-build.js');
  process.exit(1);
}

shell.echo('\n#################################################################');
shell.echo('# export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -project ios/example.xcodeproj -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build');
if (shell.exec('export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -project ios/example.xcodeproj -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build', {silent: true}).code !== 0) {
  shell.echo('error: export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -project ios/example.xcodeproj -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build');
  process.exit(1);
}

shell.echo('\n#################################################################');
shell.echo('# export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -project ios/example.xcodeproj -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build');
if (shell.exec('export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -project ios/example.xcodeproj -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build', {silent: true}).code !== 0) {
  shell.echo('error: export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -project ios/example.xcodeproj -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build');
  process.exit(1);
}

shell.echo('\n');
