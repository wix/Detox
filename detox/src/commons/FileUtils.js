const fs = require('fs');

function writeFile(name, content) {
  fs.writeFile(name, content, (err) => {
    if (err) {
      throw new Error(`can't create ${name}, raeason: ${err}`);
    }
  });
}

module.exports = {
  writeFile
};
