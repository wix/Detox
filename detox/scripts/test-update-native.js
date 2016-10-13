var shell = require('shelljs');

shell.echo('\n#################################################################');
shell.echo('cd test');
shell.cd('test');

shell.echo('\n#################################################################');
shell.echo('# killing any running react-native packagers');
shell.exec('pkill -f "react-native/packager" ; pkill -f "react-native start"');

shell.echo('\n#################################################################');
shell.echo('# react-native run-ios');
if (shell.exec('react-native run-ios').code !== 0) {
  shell.echo('error: react-native run-ios');
  process.exit(1);
}

shell.echo('\n#################################################################');
shell.echo('# react-native run-ios --scheme "example Release"');
if (shell.exec('react-native run-ios --scheme "example Release"').code !== 0) {
  shell.echo('error: react-native run-ios --scheme "example Release"');
  process.exit(1);
}

shell.echo('\n#################################################################');
shell.echo('# killing ios simulator');
shell.exec('killall "Simulator"');

shell.echo('\n');
