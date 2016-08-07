var shell = require('shelljs');

shell.echo('\n#################################################################');
shell.echo('# npm run build');
if (shell.exec('npm run build').code !== 0) {
  shell.echo('error: npm run build');
  process.exit(1);
}

shell.echo('\n#################################################################');
shell.echo('cd test');
shell.cd('test');

shell.echo('\n#################################################################');
shell.echo('copy detox js');
shell.cp('-Rf', '../lib/*', 'node_modules/detox/lib');
shell.cp('-Rf', '../scripts/*', 'node_modules/detox/scripts');

shell.echo('\n#################################################################');
shell.echo('copy detox-server js');
shell.cp('-Rf', '../../detox-server/index.js', 'node_modules/detox-server');
shell.cp('-Rf', '../../detox-server/src/*', 'node_modules/detox-server/src');

shell.echo('\n');
