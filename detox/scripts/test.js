var shell = require('shelljs');

shell.echo('\n#################################################################');
shell.echo('# cd test');
shell.cd('test');

shell.echo('\n#################################################################');
shell.echo('# npm run e2e');
if (shell.exec('npm run e2e', {stdio: ['pipe', 'pipe', 'pipe']}).code !== 0) {
  shell.echo('error: npm run e2e');
  process.exit(1);
}

shell.echo('\n');
