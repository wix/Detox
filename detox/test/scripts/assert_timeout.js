// eslint-disable no-process-exit
const cp = require('child_process');

const [_0, _1, command, ...args] = process.argv;

const testProcess = cp.spawn(command, args, { stdio: 'inherit' });

let handle = setTimeout(() => {
  handle = null;
  testProcess.kill('SIGTERM');
}, 60000);

testProcess.on('exit', (code) => {
  if (code === 0 || !handle) {
    console.error('Assertion failed! Detox should have exited with its own timeout error, but it did not.');
    process.exit(1);
  } else {
    console.log('Assertion passed. Detox on its own has torn down an E2E test after a timeout.');
    process.exit(0);
  }
});
