module.exports = {
  //#region *** Runner Realm ***

  get DetoxCircusEnvironment() {
    return require('./testEnvironment');
  },

  //#endregion

  //#region *** Worker Realm ***

  get globalSetup() {
    return require('./globalSetup');
  },

  get globalTeardown() {
    return require('./globalTeardown');
  },

  //#endregion
};
