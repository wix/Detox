const copilot = require('detox-copilot').default;

const detoxCopilotFrameworkDriver = require('./detoxCopilotFrameworkDriver');

class DetoxCopilot {
  constructor() {
    this.isInitialized = false;
  }

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

  perform(intent) {
    return copilot.perform(intent);
  }
}

module.exports = DetoxCopilot;
