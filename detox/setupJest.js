const yargs = require('yargs');
const path = require('path');

function callCli(modulePath, cmd) {
  const parser = yargs
    .scriptName('detox')
    .command(require(path.join(__dirname, "local-cli", modulePath)))
    .help();

  return new Promise((resolve, reject) => {
    try {
      parser.parse(cmd, (err, argv, output) => resolve(output));
    } catch (e) {
      reject(e);
    }
  });
}

function mockPackageJson(mockContent) {
  jest.mock(path.join(process.cwd(), 'package.json'), () => ({
    detox: mockContent
  }));
}

global.mockPackageJson = mockPackageJson;
global.callCli = callCli;