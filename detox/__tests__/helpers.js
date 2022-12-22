const path = require('path');

const fs = require('fs-extra');
const _ = require('lodash');
const tempfile = require('tempfile');
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
        'boolean-negation': true,
        'camel-case-expansion': false,
        'dot-notation': false,
        'duplicate-arguments-array': false,
        'populate--': true,
      })
      .command(spiedModule)
      .wrap(null)
      .exitProcess(false)
      .fail((msg, err) => reject(err || msg))
      .parse(cmd, (err) => err && reject(err));
  });
}

function buildMockCommand(options = {}) {
  if (!options.stdout) {
    options.stdout = tempfile('.txt');
  }

  return {
    get cmd() {
      const env = [
        options.exitCode ? `CLI_EXIT_CODE=${options.exitCode}` : undefined,
        options.sleep ? `CLI_SLEEP=${options.sleep}` : undefined,
        `CLI_TEST_STDOUT=${options.stdout}`,
      ].filter(Boolean).join(' ');

      return `cross-env ${env} node ${path.join(__dirname, '../local-cli/__mocks__/executable')}`;
    },

    options,

    _calls: undefined,

    get calls() {
      if (this._calls === undefined) {
        if (fs.existsSync(options.stdout)) {
          this._calls = fs.readFileSync(options.stdout, 'utf8')
            .trim()
            .split('\n')
            .map(c => JSON.parse(c));
        } else {
          this._calls = [];
        }
      }

      return this._calls;
    },

    async clean() {
      await fs.remove(options.stdout);
    },
  };
}

exports.buildMockCommand = buildMockCommand;
exports.callCli = callCli;
exports.latestInstanceOf = (clazz) => _.last(clazz.mock.instances);
exports.lastCallTo = (mocked) => _.last(mocked.mock.calls);
exports.backupProcessEnv = () => {
  /** @type {NodeJS.ProcessEnv} */
  let environmentCopy;
  beforeEach(() => environmentCopy = process.env);
  afterEach(() => process.env = { ...environmentCopy });
};

