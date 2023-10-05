const _ = require('lodash');

function hasTimedOut(test) {
  const { errors } = test;
  const errorsArray = (_.isArray(errors) ? errors : [errors]);
  const timedOut = _.chain(errorsArray)
    .flattenDeep()
    .filter(_.isObject)
    .some(e => _.includes(e.message, 'Exceeded timeout'))
    .value();

  return timedOut;
}

module.exports = hasTimedOut;
