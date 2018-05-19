const os = require('os');
const fs = require('fs');
const downloadFileSync = require('download-file-sync');

module.exports = function downloadJava(url) {
    const tmpDir = os.tmpdir();
    const fileContent = downloadFileSync(url);
  
    const result = Buffer.from(fileContent, 'base64').toString('ascii');
    const filePath = tmpDir + '/download.java';
    fs.writeFileSync(filePath, result);
    return filePath;
}