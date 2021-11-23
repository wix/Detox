const path = require('path');

const fs = require('fs-extra');
const glob = require('glob');

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

function globSync(cwd, pattern) {
  return glob.sync(pattern, { cwd });
}

module.exports = {
  getDirectories,
  isDirEmptySync,
  globSync,
};
