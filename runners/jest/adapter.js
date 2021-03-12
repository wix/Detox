const detox = require('../../src/index');
const DetoxJestAdapter = require('./DetoxJestAdapter');

module.exports = new DetoxJestAdapter(detox);
