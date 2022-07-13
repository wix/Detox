const realm = require('./src/realms');
const DetoxInternalsFacade = require('./src/realms/DetoxInternalsFacade');

module.exports = new DetoxInternalsFacade(realm);
