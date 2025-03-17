const detox = require('../..');

/** @type {Detox.PilotFacade} */
class DetoxPilot {
  init(promptHandler) {
    const { Pilot } = this.requireOrThrow('@wix-pilot/core');
    const { DetoxFrameworkDriver } = this.requireOrThrow('@wix-pilot/detox');

    this.pilot = new Pilot({
      frameworkDriver: new DetoxFrameworkDriver(detox),
      promptHandler: promptHandler
    });
  }

  requireOrThrow(packageName) {
    try {
      return require(packageName);
    } catch (error) {
      throw new Error(
        `Failed to load ${packageName}.` +
        `Please install ${packageName} as it's a peer dependency: npm install --save-dev ${packageName}`
      );
    }
  }

  start() {
    if (!this.isInitialized()) {
      throw new Error('DetoxPilot is not initialized');
    }
    return this.pilot.start();
  }

  perform(...steps) {
    if (!this.isInitialized()) {
      throw new Error('DetoxPilot is not initialized');
    }
    return this.pilot.perform(...steps);
  }

  autopilot(goal) {
    if (!this.isInitialized()) {
      throw new Error('DetoxPilot is not initialized');
    }
    return this.pilot.autopilot(goal);
  }

  extendAPICatalog(categories, context) {
    if (!this.isInitialized()) {
      throw new Error('DetoxPilot is not initialized');
    }
    return this.pilot.extendAPICatalog(categories, context);
  }

  end(shouldSaveInCache) {
    if (!this.isInitialized()) {
      throw new Error('DetoxPilot is not initialized');
    }
    return this.pilot.end(shouldSaveInCache);
  }

  isInitialized() {
    return !!this.pilot;
  }
}

module.exports = DetoxPilot;
