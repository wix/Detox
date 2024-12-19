const copilot = require('detox-copilot').default;

const detoxCopilotFrameworkDriver = require('./detoxCopilotFrameworkDriver');

/**
 * @typedef {Object} Detox.DetoxCopilotFacade
 */
class DetoxCopilot {
  init(promptHandler) {
    copilot.init({
      frameworkDriver: detoxCopilotFrameworkDriver,
      promptHandler: promptHandler
    });
  }

  perform(...steps) {
    return copilot.perform(...steps);
  }
}

module.exports = DetoxCopilot;
