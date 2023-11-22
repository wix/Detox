const isArrowFunction = require('./isArrowFunction');

const EXAMPLE = `Here are some examples of valid function strings:

1. function(el) { el.click(); }
2. el => el.click()
3. (el) => el.click()
`;

/**
 * Dynamically evaluates a string as a function and throws an error if it's not a function
 * @param {string} str serialized function like 'function() { return 42; }'
 */
function assertIsFunction(str) {
  let isFunction;

  try {
    isFunction = isFunctionDeclaration(str) && Function(`return typeof (${str})`)() === 'function';
  } catch (e) {
    isFunction = false;
  }

  if (!isFunction) {
    throw new TypeError(`Expected a valid function string, but got: ${str}\n\n${EXAMPLE}`);
  }

  return str;
}

function isFunctionDeclaration(rawStr) {
  const str = rawStr.trimStart();
  return str.startsWith('async') || str.startsWith('function') || isArrowFunction(str);
}

module.exports = assertIsFunction;
