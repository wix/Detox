const DetoxInternalsFacade = require('./src/DetoxInternalsFacade');
const realm = require('./src/realms');

module.exports = new DetoxInternalsFacade(realm);
