const { makeResourceTitle } = require('./utils');

module.exports = function(properties) {
  return makeResourceTitle(
    `There are ${properties.pending_updates} pending React Native node animation updates.`
  );
};
