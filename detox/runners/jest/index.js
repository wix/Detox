module.exports = {
  //#region *** Runner Realm ***

  get DetoxCircusEnvironment() {
    return require('./environment');
  },

  //#endregion

  //#region *** Worker Realm ***

  get SpecReporter() {
    return require('./environment/listeners/SpecReporter');
  },

  get WorkerAssignReporter() {
    return require('./environment/listeners/WorkerAssignReporter');
  },

  get globalSetup() {
    return require('../../realms/secondary').setup;
  },

  get globalTeardown() {
    return require('../../realms/secondary').teardown;
  },

  //#endregion
};
