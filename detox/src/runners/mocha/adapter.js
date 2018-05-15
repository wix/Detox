const detox = require('../../index');
const DetoxMochaAdapter = require('./DetoxMochaAdapter');

module.exports = new DetoxMochaAdapter(detox);
