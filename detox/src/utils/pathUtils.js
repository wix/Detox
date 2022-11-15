const path = require('path');

function toSimplePath(filePath, cwd = process.cwd()) {
  const relativePath = path.relative(cwd, filePath);
  const isOutsideCwd = relativePath.split(path.sep, 1)[0] === '..';
  return isOutsideCwd ? filePath : relativePath;
}

module.exports = {
  toSimplePath,
};
