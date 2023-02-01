const t = require("@babel/types");

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function methodNameToSnakeCase(name) {
  return name
          .split(':')
          .map((item, index) => 
            index === 0 ? item : capitalizeFirstLetter(item)
          ).join('');
}

function callGlobal(sanitizerName) {
  return argIdentifier =>
    t.callExpression(t.identifier(sanitizerName), [t.identifier(argIdentifier)]);
}

module.exports = {
  methodNameToSnakeCase,
  callGlobal
};