const path = require('path');

const fs = require('fs-extra');

function isDirEmptySync(dirPath) {
  const files = fs.readdirSync(dirPath);
  return files.length === 0;
}

async function getDirectories (rootPath) {
  let files = await fs.readdir(rootPath);
  let dirs = [];
  for (let file of files) {
    let pathString = path.resolve(rootPath, file);
    if ((await fs.stat(pathString)).isDirectory()) {
      dirs.push(file);
    }
  }
  return dirs.sort();
}

async function remove(filePath) {
  if (await fs.exists(filePath)) {
    await fs.remove(filePath);
    return true;
  }

  return false;
}

module.exports = {
  copy: fs.copy,
  ensureDir: fs.ensureDir,
  exists: fs.exists,
  getDirectories,
  isDirEmptySync,
  readdirSync: fs.readdirSync,
  remove,
};
