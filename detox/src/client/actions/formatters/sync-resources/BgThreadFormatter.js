const { makeResourceTitle } = require('./utils');

module.exports = function(properties) {
  return `${makeResourceTitle(`Background work taking place in ${properties.reason}.`)}`;
};
