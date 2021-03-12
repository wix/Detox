const detox = require('../../src/index');
const DetoxMochaAdapter = require('./DetoxMochaAdapter');

module.exports = new DetoxMochaAdapter(detox);
