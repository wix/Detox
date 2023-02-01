module.exports = {
  DetoxLogger: require('./DetoxLogger'),
  DetoxLogFinalizer: require('./utils/DetoxLogFinalizer'),
  installLegacyTracerInterface: require('./utils/tracerLegacy').install,
};
