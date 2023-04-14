const { makeResourceTitle } = require('./utils');

module.exports = function(properties) {
  return makeResourceTitle(
    `There are ${properties.works_count} work items pending on the dispatch queue: "${properties.queue}".`
  );
};
