var shell = require('shelljs');

shell.cd('test');

shell.echo('\n#################################################################');
if (!shell.exec('netstat -n -atp tcp | grep -i "listen" | grep ".8081"', {silent: true}).stdout) {
  shell.echo('# react-native packager is not running, run it');
  if (shell.exec('../node_modules/.bin/ttab -w react-native start').code !== 0) {
    shell.echo('# error: cannot run react-native start in a new tab');
    process.exit(1);
  }
  shell.exec('sleep 5');
} else {
  shell.echo('# react-native packager is already running');
}