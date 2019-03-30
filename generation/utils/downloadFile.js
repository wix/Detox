const cp = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const URL = require('url');
const uuidv4 = require('uuid/v4');

function dumpCertificate(url, port = 443) {
  const execOptions = {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    timeout: 5000,
  };

  let host = URL.parse(url).host;
  if (!host.includes(':')) {
    host += ':443';
  }

  const args = ['s_client', '-showcerts', '-connect', host];
  console.log(['openssl', ...args].join(' '));

  return cp.execFileSync('openssl', args, execOptions);
}

function getCurlPath() {
  try {
    const prefix = cp.execFileSync('brew', ['--prefix', 'curl'], {
      encoding: 'utf8',
    }).trim();

    return path.join(prefix, 'bin/curl');
  } catch (e) {
    return 'curl';
  }
}

let curlPath;

function downloadFileSync(url) {
  const flags = ['--silent', '--show-error', '-L'];
  const execOptions = {
    encoding: 'utf8',
  };

  try {
    curlPath = curlPath || getCurlPath();
    return cp.execFileSync(curlPath, [...flags, url], execOptions);
  } catch (e) {
    if (e.stderr.indexOf('SSL certificate problem') >= 0) {
      console.log('\nDumping SSL certificate details:\n');
      console.log(dumpCertificate(url));
    }

    throw e;
  }
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
