var shell = require('shelljs');

shell.exec('npm run start-packager');

shell.exec('npm run start-server');

if (process.argv[2] !== '--release') {
  shell.exec('npm run test-exec-debug');
}

if (process.argv[2] !== '--debug') {
  shell.exec('npm run test-exec-release');
}

shell.echo('\n');
