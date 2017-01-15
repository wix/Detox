require('shelljs/global');
require('./logger');
set('-e');

cd('test');

console.step('npm run e2e (debug)');
let argv = process.argv.slice(2).map(str => str.toLowerCase());
exec('npm run e2e -- --___detoxargs___:::"' + argv.join(' ') + '"');