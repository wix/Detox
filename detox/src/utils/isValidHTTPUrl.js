const { URL } = require('url');

function isValidHTTPUrl(url) {
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch (err) {
    return false;
  }
}

module.exports = isValidHTTPUrl;
