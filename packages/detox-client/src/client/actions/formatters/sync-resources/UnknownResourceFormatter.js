const { makeResourceTitle } = require('./utils');

module.exports = function(properties) {
  return makeResourceTitle(`Resource "${properties.identifier}" is busy.`);
};
