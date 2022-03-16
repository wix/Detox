function isCtrlC(chunk) {
  const [chr1] = Array.from(chunk);
  return chr1 === 3;
}

async function pressAnyKey() {
  return new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.setRawMode(true);
    process.stdin.once('data', onData);

    function onData(chunk) {
      process.stdin.removeListener('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.nextTick(resolve);

      if (isCtrlC(chunk)) {
        process.kill(process.pid, 'SIGINT');
      }
    }
  });
}

module.exports = pressAnyKey;
