const { makeResourceTitle } = require('./utils');

module.exports = function(properties) {
  return makeResourceTitle(
    `There are ${properties.pending_selectors} pending delayed selectors to be performed.`
  );
};
