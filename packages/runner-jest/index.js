// Lazy require() is used to avoid initializing a bare Detox context when it is not needed.
// At the moment, this safety measure is not really needed, but it's better to be on the safe side.

module.exports = {
  get DetoxCircusEnvironment() {
    return require('./testEnvironment');
  },

  get globalSetup() {
    return require('./globalSetup');
  },

  get globalTeardown() {
    return require('./globalTeardown');
  },
};
