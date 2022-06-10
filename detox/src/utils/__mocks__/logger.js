const DetoxLogger = require('./DetoxLogger');
module.exports = DetoxLogger.instances[0] || new DetoxLogger();
