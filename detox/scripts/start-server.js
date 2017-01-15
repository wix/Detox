require('shelljs/global');
require('./logger');

cd('test');

if (!exec('netstat -n -atp tcp | grep -i "listen" | grep ".8099"', {silent: true}).stdout) {
  console.step('detox-server is not running, run it...');
  if (exec('../node_modules/.bin/ttab -w node ./node_modules/.bin/detox-server').code !== 0) {
    console.error('cannot run detox-server in a new tab');
    process.exit(1);
  }
  exec('sleep 2');
} else {
  console.error('detox-server is already running');
}