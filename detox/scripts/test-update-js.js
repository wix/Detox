require('shelljs/global');
require('./logger');

console.step('cd test');
cd('test');

console.step('copy detox-server js');

cp('-Rf', '../../detox-server/index.js', 'node_modules/detox-server');
cp('-Rf', '../../detox-server/src/*', 'node_modules/detox-server/src');