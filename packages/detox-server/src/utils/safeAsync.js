async function safeAsync(fnOrValue) {
  if (typeof fnOrValue === 'function') {
    const fn = fnOrValue;
    return (await fn());
  } else {
    return fnOrValue;
  }
}

module.exports = safeAsync;

