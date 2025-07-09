const { Pilot } = require('@wix-pilot/core');
const { DetoxFrameworkDriver }  = require('@wix-pilot/detox');

const detox = require('../..');

/** @type {Detox.PilotFacade} */
class DetoxPilot {
  init(maybePromptHandler) {
    const options = maybePromptHandler.promptHandler ? {
      frameworkDriver: new DetoxFrameworkDriver(detox),
      ...maybePromptHandler,
    } : {
      frameworkDriver: new DetoxFrameworkDriver(detox),
      promptHandler: maybePromptHandler,
    };

    this.pilot = new Pilot(options);
  }

  start(){
    if (!this.isInitialized()) {
      throw new Error('DetoxPilot is not initialized');
    }
    return this.pilot.start();
  }

  perform(...steps){
    if (!this.isInitialized()) {
      throw new Error('DetoxPilot is not initialized');
    }
    return this.pilot.perform(...steps);
  }

  autopilot(goal) {
    return this.pilot.autopilot(goal);
  }

  extendAPICatalog(categories, context) {
    return this.pilot.extendAPICatalog(categories, context);
  }

  end(shouldSaveInCache){
    if(!this.isInitialized()){
      throw new Error('DetoxPilot is not initialized');
    }
    return this.pilot.end(shouldSaveInCache);
  }

  isInitialized(){
    return !!this.pilot;
  }
}

module.exports = DetoxPilot;
