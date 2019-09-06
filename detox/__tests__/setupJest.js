jest.mock('proper-lockfile');

const yargs = require('yargs');
const path = require('path');

function callCli(modulePath, cmd) {
  return new Promise((resolve, reject) => {
    try {
      yargs
        .scriptName('detox')
        .command(require(path.join(__dirname, "../local-cli", modulePath)))
        .exitProcess(false)
        .fail((msg, err) => reject(err || msg))
        .parse(cmd, (err, argv, output) => {
          err ? reject(err) : setImmediate(() => resolve(output));
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
