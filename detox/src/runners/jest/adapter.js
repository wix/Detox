const detox = require('../../index');
const DetoxJestAdapter = require('./DetoxJestAdapter');

module.exports = new DetoxJestAdapter(detox);