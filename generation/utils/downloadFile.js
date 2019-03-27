const cp = require('child_process');
const os = require('os');
const fs = require('fs');
const uuidv4 = require('uuid/v4');

function downloadFileSync(url) {
  const flags = ['--silent', '--show-error', '-L'];
  const execOptions = {
    encoding: 'utf8',
  };

  return cp.execFileSync('curl', [...flags, url], execOptions);
}

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
