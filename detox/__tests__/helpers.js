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

/**
 * A syntactic-sugar wrapper for performing expectations while a tested async method/func is
 * suspended, based on a "suspending mock".
 *
 * It applies the following technique:
 *
 * 1. Setting up an (async) mock function -- which the method under test normally calls, such that it would suspended
 *    until a provided inner callback is completed.
 * 2. Calling the method under test, making expectations inside a callback using a custom `callSuspended` function.
 *
 * @example
 * await withSuspendingMock(innerMockObj, 'mockedMethodName', async ({ callSuspended }) => {
 *   await callSuspended(uut.methodUnderTest(), async () => {
 *     expect(uut.nextSolarEclipse()).toEqual( Date.parse('20 Apr 2023') );
 *
 *     return 'result-of-suspended-method'; // (Optional)
 *   }); // Resolve suspended method
 * }); // Await methodUnderTest's promise
 */
async function withSuspendingMock(obj, func, callback) {
  let resolve;

  const promise = new Promise((_resolve, _reject) => { resolve = _resolve; });
  obj[func].mockImplementation(() => promise);

  const callSuspended = async (promise, callback) => {
    const result = await callback();
    resolve(result);

    await promise;
  };

  await callback({ callSuspended });
}

exports.callCli = callCli;
exports.withSuspendingMock = withSuspendingMock;
exports.latestInstanceOf = (clazz) => _.last(clazz.mock.instances);
exports.lastCallTo = (mocked) => _.last(mocked.mock.calls);
exports.throwErrorImpl = (message = '') => { throw new Error(message); };

const _uuidRegexp = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

exports.uuidRegexp = new RegExp(`^${_uuidRegexp}$`);
exports.tempFileRegexp = new RegExp(`.*${_uuidRegexp}.detox.json`);
