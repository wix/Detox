const { makeResourceTitle } = require('./utils');

module.exports = function(properties) {
  return makeResourceTitle(`Run loop "${properties.name}" is awake.`);
};
