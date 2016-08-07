var shell = require('shelljs');

shell.echo('\n#################################################################');
shell.echo('# killing any running react-native packagers');
shell.exec('pkill -f "react-native/packager"');

shell.echo('\n#################################################################');
shell.echo('# killing ios simulator');
shell.exec('killall "Simulator"');

shell.echo('\n#################################################################');
shell.echo('# killing detox-server');
shell.exec('pkill -f "detox-server"');

shell.echo('\n#################################################################');
shell.echo('# cd test');
shell.cd('test');

shell.echo('\n#################################################################');
shell.echo('# deleting node modules');
shell.rm('-rf', './node_modules');

shell.echo('\n#################################################################');
shell.echo('# deleting ios build');
shell.rm('-rf', 'ios/build');

shell.echo('\n');
