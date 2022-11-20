const { makeResourceTitle, makeResourceSubTitle } = require('./utils');

const propertyToDescriptionMapping = {
  'reason': `Reason`
};

module.exports = function(properties) {
  let countersDescriptions = [];
  for (const [key, value] of Object.entries(properties)) {
    countersDescriptions.push(makeResourceSubTitle(`${propertyToDescriptionMapping[key]}: ${value}`));
  }

  return `${makeResourceTitle(`Background threads are busy:`)}\n${countersDescriptions.join('.\n')}.`;
};
