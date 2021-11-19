const { makeResourceTitle } = require('./utils');

module.exports = function(properties) {
  const objectName = properties.object;
  return makeResourceTitle(
    `The event "${properties.event}" is taking place${(objectName === undefined) ? `.` : ` with object: "${objectName}".`}`
  );
};
