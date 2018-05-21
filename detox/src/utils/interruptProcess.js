const npmlog = require('npmlog');

async function interruptProcess(childProcessPromise, signal = 'SIGINT') {
  const process = childProcessPromise.childProcess;

  npmlog.verbose('interruptProcess', 'sending %s to pid %s (%j)',
    signal,
    childProcessPromise.childProcess.pid,
    process.spawnargs
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