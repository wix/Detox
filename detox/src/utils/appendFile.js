const fs = require('fs');

async function appendFile(src, dest) {
  const writeStream = fs.createWriteStream(dest, { flags: 'a' });
  const readStream = fs.createReadStream(src);

  const promise = new Promise((resolve, reject) => {
    readStream.on('error', e => reject(e));
    writeStream.on('error', /* istanbul ignore next */ e => reject(e));
    writeStream.on('close', () => resolve());
  });

  readStream.pipe(writeStream);
  return promise;
}

module.exports = appendFile;
