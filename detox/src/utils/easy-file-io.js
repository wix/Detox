const tempfile = require('tempfile');
const fs = require('fs');

function saveRawBase64Data(dataBase64, { filePath, fileSuffix }) {
  const _filePath = filePath || tempfile(fileSuffix);
  const data = Buffer.from(dataBase64, 'base64');
  fs.writeFileSync(_filePath, data);
  return _filePath;
}

module.exports = {
  saveRawBase64Data,
};
