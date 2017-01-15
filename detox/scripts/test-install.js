require('shelljs/global');
require('./logger');
set('-e');

//console.step('npm run build');
//if (exec('npm run build', {silent: true}).code !== 0) {
//  console.log('error: npm run build');
//  process.exit(1);
//}

console.step('cd test');
cd('test');

console.step('npm install');
exec('npm install');

if (!exec('netstat -n -atp tcp | grep -i "listen" | grep ".8099"', {silent: true}).stdout) {
  console.step('detox-server is not running, run it...');
  if (exec('../node_modules/.bin/ttab -w node ./node_modules/.bin/detox-server').code !== 0) {
    console.error('cannot run detox-server in a new tab');
    process.exit(1);
  }
} else {
  console.warn('detox-server is already running');
}

console.step('killing any running react-native packagers');
exec('pkill -f "react-native/packager" ; pkill -f "react-native start" || true');

console.step('node ./node_modules/detox/scripts/clean-build.js');
exec('node ./node_modules/detox/scripts/clean-build.js');

console.step('export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -project ios/example.xcodeproj -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build');
exec('export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -project ios/example.xcodeproj -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build', {silent: true});

console.step('export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -project ios/example.xcodeproj -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build');
exec('export RCT_NO_LAUNCH_PACKAGER=true && xcodebuild -project ios/example.xcodeproj -scheme example -configuration Release -sdk iphonesimulator -derivedDataPath ios/build', {silent: true});