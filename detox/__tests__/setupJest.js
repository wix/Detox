jest.mock('proper-lockfile');

const yargs = require('yargs');
const path = require('path');

function callCli(modulePath, cmd) {
  return new Promise((resolve, reject) => {
    const originalModule = require(path.join(__dirname, "../local-cli", modulePath));
    const originalHandler = originalModule.handler;
    const spiedModule = {
      ...originalModule,
      handler: async program => {
        try {
          return await originalHandler(program);
        } catch (e) {
          reject(e);
        } finally {
          resolve();
        }
      }
    };

    return yargs
      .scriptName('detox')
      .command(spiedModule)
      .exitProcess(false)
      .fail((msg, err) => reject(err || msg))
      .parse(cmd, (err) => err && reject(err));
  });
}

global.callCli = callCli;
global.IS_RUNNING_DETOX_UNIT_TESTS = true;
