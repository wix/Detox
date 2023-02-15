const _ = require('lodash');

// const DetoxRuntimeError = require('./errors/DetoxRuntimeError');
const EarlGrey = require('./invoke/EarlGrey');
const Espresso = require('./invoke/Espresso');
const EspressoWeb = require('./invoke/EspressoWeb');
const Invoke = require('./invoke/Invoke');
const logger = require('./utils/logger');

const log = logger.child({ cat: 'device' });

class InvocationManager {
  constructor(excutionHandler) {
    this.executionHandler = excutionHandler;
  }

  async execute(invocation) {
   return await this.executionHandler.execute(invocation);
  }

  // async executeCloudAdb(invocation) {
  //   return await this.executionHandler.waitForCloudAdb(invocation);
  // }

  async executeCloudPlatform(invocation) {
    const response = await this.executionHandler.waitForCloudPlatform(invocation);
    const status = _.get(response, 'response.success');
    if (!status) {
      const message = _.get(response, 'response.message');
      log.warn({ error: message }, 'An error occurred while waiting for response from cloud');
      // throw new DetoxRuntimeError(message);
    }
    return response;
  }
}

module.exports = {
  InvocationManager,
  EarlGrey,
  Espresso: Espresso.target,
  EspressoWeb: EspressoWeb.target,
  IOS: Invoke.genericInvokeObject,
  Android: Invoke.genericInvokeObject,
  call: Invoke.call,
  callDirectly: Invoke.callDirectly
};
