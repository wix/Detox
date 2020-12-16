const { exec } = require('child_process');

const execCommand = async (cmd) => {
  const cp = exec(cmd);
  cp.stdout.pipe(process.stdout);
  cp.stderr.pipe(process.stderr);
  return new Promise((resolve) => {
    cp.on('close', resolve);
  });
}

module.exports = {
  execCommand,
};
