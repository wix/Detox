const { URL } = require('url');

function isValidWebsocketURL(url) {
  try {
    const { protocol } = new URL(url);
    return protocol === 'ws:' || protocol === 'wss:';
  } catch (err) {
    return false;
  }
}

module.exports = isValidWebsocketURL;
