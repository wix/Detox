require('shelljs/global');
require('./logger');

console.step('killing any running react-native packagers');
exec('pkill -f "react-native/packager" ; pkill -f "react-native start"');

console.step('killing ios simulator');
exec('killall "Simulator"');

console.step('killing detox-server');
exec('pkill -f "detox-server"');

console.step('cd test');
cd('test');

console.step('# deleting node modules');
rm('-rf', './node_modules');

console.step('# deleting ios build');
rm('-rf', 'ios/build');
