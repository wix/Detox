const path = require('path');

const _ = require('lodash');
const yargs = require('yargs');

function callCli(modulePath, cmd) {
  return new Promise((resolve, reject) => {
    const originalModule = require(path.join(__dirname, '../local-cli', modulePath));
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
      .parserConfiguration({
        'boolean-negation': false,
        'camel-case-expansion': false,
        'dot-notation': false,
        'duplicate-arguments-array': false,
      })
      .command(spiedModule)
      .exitProcess(false)
      .fail((msg, err) => reject(err || msg))
      .parse(cmd, (err) => err && reject(err));
  });
}

exports.callCli = callCli;
exports.latestInstanceOf = (clazz) => _.last(clazz.mock.instances);
exports.lastCallTo = (mocked) => _.last(mocked.mock.calls);
exports.backupProcessEnv = () => {
  /** @type {NodeJS.ProcessEnv} */
  let environmentCopy;
  beforeEach(() => environmentCopy = process.env);
  afterEach(() => process.env = { ...environmentCopy });
};

