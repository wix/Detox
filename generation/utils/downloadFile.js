const os = require('os');
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const downloadFileSync = require('download-file-sync');

module.exports = function downloadJava(url, encoding = 'none') {
  const tmpDir = os.tmpdir();
  const fileContent = downloadFileSync(url);

  let result = fileContent;
  if (encoding === 'base64') {
    result = Buffer.from(fileContent, 'base64').toString('ascii');
  }

  const filePath = tmpDir + `/${uuidv4()}.java`;
  fs.writeFileSync(filePath, result);
  return filePath;
};
