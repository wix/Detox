const { Pilot } = require('@wix-pilot/core');
const { DetoxFrameworkDriver }  = require('@wix-pilot/detox');

const detox = require('../..');

/** @type {Detox.PilotFacade} */
class DetoxPilot {
  /**
   * @param {Partial<import('@wix-pilot/core').Config>} [defaults] Arbitrary config defaults for the Pilot.
   */
  constructor(defaults = {}) {
    this._defaults = defaults;
  }

  init(promptHandler) {
    this.pilot = new Pilot({
      ...this._defaults,
      frameworkDriver: new DetoxFrameworkDriver(detox),
      promptHandler: promptHandler,
    });
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

  /**
   * @param {Partial<import('@wix-pilot/core').Config>} [defaults] Arbitrary config defaults for the Pilot.
   * @internal
   */
  setDefaults(defaults) {
    Object.assign(this._defaults, defaults);
  }
}

module.exports = DetoxPilot;
