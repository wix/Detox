require('shelljs/global');
require('./logger');
set('-e');

console.step('cd test');
cd('test');

console.step('killing any running react-native packagers');
exec('pkill -f "react-native/packager" ; pkill -f "react-native start" || true');

console.step('react-native run-ios');
exec('react-native run-ios');

console.step('react-native run-ios --scheme "example Release"');
exec('react-native run-ios --scheme "example Release"');

console.step('killing ios simulator');
exec('killall "Simulator" || true');
