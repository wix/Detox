const detox = require('../../src/index');
const DetoxLifecycleAdapter = require('./DetoxLifecycleAdapter');

module.exports = new DetoxLifecycleAdapter(detox);
