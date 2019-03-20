const yargs = require('yargs');
const path = require('path');

function callCli(modulePath, cmd) {
  require('../local-cli/utils/catchAndLog').throwErrors(true);

  const parser = yargs
    .scriptName('detox')
    .command(require(path.join(__dirname, "../local-cli", modulePath)))
    .exitProcess(false)
    .help();

  return new Promise((resolve, reject) => {
    try {
      parser.parse(cmd, (err, argv, output) => {
        err ? reject(err) : resolve(output);
      });
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
