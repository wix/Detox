const copilot = require('detox-copilot').default;

const detoxCopilotFrameworkDriver = require('./detoxCopilotFrameworkDriver');

/**
 * @typedef {Object} Detox.DetoxCopilotFacade
 */
class DetoxCopilot {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * @param {Detox.DetoxCopilotPromptHandler} promptHandler
   */
  init(promptHandler) {
    copilot.init({
      frameworkDriver: detoxCopilotFrameworkDriver,
      promptHandler: promptHandler
    });

    this.isInitialized = true;
  }

  resetIfNeeded() {
    if (!this.isInitialized) {
      // Copilot is not initialized, nothing to reset
      return;
    }

    copilot.reset();
  }

  /**
   * @param {String} action
   */
  act(action) {
    return copilot.act(action);
  }

  /**
   * @param {String} assertion
   */
  assert(assertion) {
    return copilot.assert(assertion);
  }
}

module.exports = DetoxCopilot;
