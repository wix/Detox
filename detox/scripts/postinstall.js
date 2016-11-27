var shell = require('shelljs');


shell.echo('\n#################################################################');
shell.echo('# fixing SocketRocket soft links');

if(shell.exec('scripts/fixup-softlinks.sh').code != 0) {
  shell.echo('error: could not fix SocketRocket soft links.');
  process.exit(1);
}


shell.echo('\n#################################################################');
shell.echo('# installing fbsimctl');
if(shell.exec('brew help', {silent: true}).code !== 0) {
  shell.echo('error: Brew is not installed. Please install brew and run again.');
  process.exit(1);
}
if(shell.exec('brew tap facebook/fb').code != 0) {
  shell.echo('error: Facebook Tap install failed.');
  process.exit(1);
}
if(shell.exec('brew install fbsimctl --HEAD').code != 0) {
  shell.echo('error: fbsimctl install failed.');
  process.exit(1);
}
