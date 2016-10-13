var shell = require('shelljs');

shell.cd('test');

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