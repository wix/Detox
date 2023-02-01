const childProcess = require('child_process');

function sh(cmdline, opts) {
  const args = cmdline.split(' ');
  const cmd = args.shift();
  return childProcess.execFileSync(cmd, args, opts);
}

module.exports = {
  sh
};
