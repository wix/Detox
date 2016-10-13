var shell = require('shelljs');

shell.cd('test');

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