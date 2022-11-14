jest.mock('proper-lockfile');
jest.mock('signal-exit');
jest.mock('../src/logger/DetoxLogger');

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
 * Override an object's mocked async-function so that its execution would be suspended
 * until actively released by the caller.
 *
 * @returns {{resolve, reject}} Handle to suspension, which can release the call either safely (resolve) or erroneously (with reject).
 */
function suspendCall(obj, func) {
  let resolve;
  let reject;

  const promise = new Promise((_resolve, _reject) => { resolve = _resolve; reject = _reject; });
  obj[func].mockImplementation(() => promise);

  return {
    resolve,
    reject,
  };
}

/**
 * Syntactic sugar for performing some work (e.g. expectations) before a specified async call resolves.
 *
 * @param promise The promise returned by the async call.
 * @param callback The work to do.
 * @returns {Promise<void>}
 */
async function doBeforeResolved(promise, callback) {
  await callback();
  await promise;
}

// @ts-ignore
global.callCli = callCli;
// @ts-ignore
global.suspendCall = suspendCall;
// @ts-ignore
global.doBeforeResolved = doBeforeResolved;

// @ts-ignore
global.latestInstanceOf = (clazz) => _.last(clazz.mock.instances);
// @ts-ignore
global.lastCallTo = (mocked) => _.last(mocked.mock.calls);

// @ts-ignore
global.throwErrorImpl = (message = '') => { throw new Error(message); };

const _uuidRegexp = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
// @ts-ignore
global.uuidRegexp = new RegExp(`^${_uuidRegexp}$`);
// @ts-ignore
global.tempFileRegexp = new RegExp(`.*${_uuidRegexp}.detox.json`);
