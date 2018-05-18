const fs = require('fs-extra');
const ensureExtension = require('./ensureExtension');

async function ensureMove(fromPath, toPath, toExtension) {
  const toPathWithExtension = ensureExtension(toPath, toExtension);

  await fs.ensureFile(toPathWithExtension);
  await fs.move(fromPath, toPathWithExtension, { overwrite: true });
}

module.exports = ensureMove;