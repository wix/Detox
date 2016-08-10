var shell = require('shelljs');

shell.echo('\n#################################################################');
shell.echo('# cd test');
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

shell.echo('\n#################################################################');
if (!shell.exec('netstat -n -atp tcp | grep -i "listen" | grep ".8099"', {silent: true}).stdout) {
  shell.echo('# detox-server is not running, run it');
  if (shell.exec('../node_modules/.bin/ttab -w node ./node_modules/.bin/detox-server').code !== 0) {
    shell.echo('# error: cannot run detox-server in a new tab');
    process.exit(1);
  }
  shell.exec('sleep 2');
} else {
  shell.echo('# detox-server is already running');
}

if (process.argv[2] !== '--release') {
  shell.echo('\n#################################################################');
  shell.echo('# npm run e2e (debug)');
  if (shell.exec('npm run e2e').code !== 0) {
    shell.echo('error: npm run e2e');
    process.exit(1);
  }
}

if (process.argv[2] !== '--debug') {
  shell.echo('\n#################################################################');
  shell.echo('# npm run e2e-release');
  if (shell.exec('npm run e2e-release').code !== 0) {
    shell.echo('error: npm run e2e-release');
    process.exit(1);
  }
}

shell.echo('\n');
