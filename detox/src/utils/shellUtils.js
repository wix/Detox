const BACK_SLASH = '\\';
const SINGLE_QUOTE = "'";
const DOUBLE_QUOTE = '"';

const ESCAPED_DOUBLE_QUOTE = BACK_SLASH + DOUBLE_QUOTE;
function escapeInDoubleQuotedString(fragment) {
  return fragment.replace(/"/g, ESCAPED_DOUBLE_QUOTE);
}

const ESCAPED_SINGLE_QUOTE = SINGLE_QUOTE + DOUBLE_QUOTE + SINGLE_QUOTE + DOUBLE_QUOTE + SINGLE_QUOTE;
function escapeWithSingleQuotedString(fragment) {
  return SINGLE_QUOTE + fragment.replace(/'/g, ESCAPED_SINGLE_QUOTE) + SINGLE_QUOTE;
}

function escapeWithDoubleQuotedString(fragment) {
  return DOUBLE_QUOTE + escapeInDoubleQuotedString(fragment) + DOUBLE_QUOTE;
}

const SPECIAL_CHARS = /([\^\$\[\]\*\.\\])/g;
function escapeInDoubleQuotedRegexp(fragment) {
  return fragment.replace(SPECIAL_CHARS, '\\$1');
}

function isRunningInCMDEXE() {
  return /* istanbul ignore next */ process.platform === 'win32' &&
         /* istanbul ignore next */ !process.env['SHELL'];
}

const UNSAFE = /[\s!"#$&'()*;<=>^?`{,}|~\[\\\]]/m;
/* @see https://unix.stackexchange.com/a/357932 */
function hasUnsafeShellChars(str) {
  return UNSAFE.test(str);
}

function autoEscapeCmd(str) {
  if (!hasUnsafeShellChars(str)) {
    return str;
  }

  return escapeWithDoubleQuotedString(str);
}

function autoEscapeShell(str) {
  if (!hasUnsafeShellChars(str)) {
    return str;
  }

  return escapeWithSingleQuotedString(str);
}

const autoEscape = isRunningInCMDEXE()
  /* istanbul ignore next */ ? autoEscapeCmd
  /* istanbul ignore next */ : autoEscapeShell;

module.exports = {
  escapeInDoubleQuotedString,
  escapeInDoubleQuotedRegexp,
  escapeWithSingleQuotedString,
  escapeWithDoubleQuotedString,
  isRunningInCMDEXE,
  hasUnsafeShellChars,
  autoEscape: Object.assign(autoEscape, {
    cmd: autoEscapeCmd,
    shell: autoEscapeShell,
  }),
};
