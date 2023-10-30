function subscribe(listener) {
  process.on('SIGINT', listener);
  process.on('SIGTERM', listener);
}

function unsubscribe(listener) {
  process.removeListener('SIGINT', listener);
  process.removeListener('SIGTERM', listener);
}

module.exports = {
  subscribe,
  unsubscribe,
};

