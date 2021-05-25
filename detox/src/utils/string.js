const _ = require('lodash');

function capitalizeFirstLetter(string) {
  if (_.isEmpty(string)) {
    return '';
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function lowerCamelCaseJoin(array) {
  if (_.isEmpty(array)) {
    return '';
  }
  const [first, ...rest] = array;
  let retVal = first;
  _.forEach(rest, (str) => {
    retVal += capitalizeFirstLetter(str);
  });
  return retVal;
}
module.exports = {
  capitalizeFirstLetter,
  lowerCamelCaseJoin
};
