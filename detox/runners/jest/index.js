module.exports = {
  //#region *** Global Realm ***

  get DetoxCircusEnvironment() {
    return require('../../realms/worker').DetoxCircusEnvironment;
  },

  get SpecReporter() {
    return require('../../realms/worker').SpecReporter;
  },

  //#endregion

  //#region *** Worker Realm ***

  get WorkerAssignReporter() {
    return require('../../realms/worker').WorkerAssignReporter;
  },

  get globalSetup() {
    return require('../../realms/runner').context.setup;
  },

  get globalTeardown() {
    return require('../../realms/runner').context.teardown;
  },

  //#endregion
};
