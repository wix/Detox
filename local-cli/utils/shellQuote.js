// This is very incomplete, don't use this for user input!
module.exports = function shellQuote(input) {
  return process.platform !== 'win32' ? `'${input}'` : `"${input}"`;
};
