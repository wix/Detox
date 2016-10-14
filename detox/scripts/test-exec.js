require('shelljs/global');

cd('test');

echo('\n#################################################################');
echo('# npm run e2e (debug)');

let argv = process.argv.slice(2).map(str => str.toLowerCase());

if (exec('npm run e2e -- --___detoxargs___:::"' + argv.join(' ') + '"').code !== 0) {
  echo('error: npm run e2e');
  exit(1);
}