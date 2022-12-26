const crypto = require('crypto');
const fs = require('fs');

const { DetoxInternalError } = require('../errors');

async function generateHash(path) {
  if (!path) {
    throw new DetoxInternalError(`Path must be provided for hash generation`);
  }

  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(path);
    const hash = crypto.createHash('md5');
    hash.setEncoding('hex');

    fileStream
      .on('end', function() {
        hash.end();
        resolve(hash.read());
      })
      .on('error', reject);

    fileStream.pipe(hash);
  });
}

module.exports = generateHash;
