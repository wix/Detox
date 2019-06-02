function encodeBase64(stringUTF8) {
  return Buffer.from(stringUTF8, 'utf8').toString('base64');
}

function decodeBase64(stringBase64) {
  return Buffer.from(stringBase64, 'base64').toString('utf8');
}

module.exports = {
  encodeBase64,
  decodeBase64,
};
