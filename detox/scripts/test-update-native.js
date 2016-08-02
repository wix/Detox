var shell = require('shelljs');

shell.echo('\n#################################################################');
shell.echo('cd test');
shell.cd('test');

shell.echo('\n#################################################################');
shell.echo('copy detox native');
shell.cp('-Rf', '../ios/*', 'node_modules/detox/ios');

shell.echo('\n#################################################################');
shell.echo('# killing any running react-native packagers');
shell.exec('pkill -f "react-native/packager"');

shell.echo('\n#################################################################');
shell.echo('# react-native run-ios');
if (shell.exec('react-native run-ios').code !== 0) {
  shell.echo('error: react-native run-ios');
  process.exit(1);
}

shell.echo('\n#################################################################');
shell.echo('# killing ios simulator');
shell.exec('killall "Simulator"');

shell.echo('\n');
