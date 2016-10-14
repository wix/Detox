require('shelljs/global');

let argv = process.argv.slice(2).map(str => str.toLowerCase());

if(argv.indexOf('nostart') == -1) {
  exec('npm run start-packager');
  exec('npm run start-server');
}
else {
  //Remove 'nostart' from array.
  argv = argv.filter(elem => elem !== 'nostart');
}

if(argv.indexOf('debug') == -1 && argv.indexOf('release') == -1) {
  //Default behavior is 'debug' if not specified otherwise.
  argv.push('debug');
}

if(argv.filter(e => e.startsWith('target=')).length == 0) {
  argv.push('target=ios-sim');
}

exec('npm run test-exec -- ' + argv.join(' '));

echo('\n');
