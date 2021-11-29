const defaultOptions = { unref: false };

async function sleep(ms, options = defaultOptions) {
  return new Promise(resolve => {
    const handle = setTimeout(resolve, ms);
    if (options.unref) {
      handle.unref();
    }
  });
}

module.exports = sleep;
