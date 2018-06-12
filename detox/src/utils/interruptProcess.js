const log = require('npmlog');

async function interruptProcess(childProcessPromise, signal = 'SIGINT') {
  const process = childProcessPromise.childProcess;

  log.verbose('interruptProcess', 'sending %s to pid %s (%s)',
    signal,
    childProcessPromise.childProcess.pid,
    process.spawnargs.join(' ')
  );

  childProcessPromise.childProcess.kill(signal);
  await childProcessPromise.catch(e => {
    /* istanbul ignore if */
    if (e.exitCode != null) {
      throw e;
    }
  });
}

module.exports = interruptProcess;