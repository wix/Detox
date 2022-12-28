function create() {
  const context = require('./index');
  const DetoxInternalsFacade = require('./src/realms/DetoxInternalsFacade');

  return new DetoxInternalsFacade(context);
}

/** @type {DetoxInternals.Facade} */
module.exports = global['__detox__']
  ? global['__detox__'].internalsApi
  : create();
