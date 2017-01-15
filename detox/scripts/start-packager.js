require('shelljs/global');
require('./logger');

cd('test');

if (!exec('netstat -n -atp tcp | grep -i "listen" | grep ".8081"', {silent: true}).stdout) {
  console.step('react-native packager is not running, run it...');
  if (exec('../node_modules/.bin/ttab -w react-native start').code !== 0) {
    console.error('cannot run react-native start in a new tab');
    process.exit(1);
  }
  exec('sleep 5');
} else {
  console.warn('react-native packager is already running');
}