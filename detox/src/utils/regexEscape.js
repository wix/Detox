const SPECIAL_CHARS = /([\^\$\[\]\*\.\\])/g;

function regexEscape(exactString) {
  return exactString.replace(SPECIAL_CHARS, "\\$1");
}

module.exports = regexEscape;