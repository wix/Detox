const os = require('os');
const path = require('path');

const fs = require('fs-extra');

function create(filename) {
  const directoryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'detoxtemp-'));
  fs.ensureDirSync(directoryPath);

  const fullPath = path.join(directoryPath, filename);
  return {
    path: fullPath,
    cleanup: () => {
      fs.removeSync(directoryPath);
    },
  };
}

module.exports = {
  create,
};
