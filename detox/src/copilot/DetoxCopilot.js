const copilot = require('detox-copilot').default;

const detoxCopilotFrameworkDriver = require('./detoxCopilotFrameworkDriver');

/**
 * @typedef {Object} Detox.DetoxCopilotFacade
 */
class DetoxCopilot {
  perform = copilot.perform;
  extendAPICatalog = copilot.extendAPICatalog;

  init(promptHandler) {
    copilot.init({
      frameworkDriver: detoxCopilotFrameworkDriver,
      promptHandler: promptHandler
    });
  }
}

module.exports = DetoxCopilot;
