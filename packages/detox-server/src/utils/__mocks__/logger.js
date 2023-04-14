const DetoxLogger = require('../../logger/__mocks__/DetoxLogger');
module.exports = DetoxLogger.instances[0] || new DetoxLogger();
