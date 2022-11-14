const SPACE = ' ';
const BACK_SLASH = '\\';
const FORWARD_SLASH = '/';
const SINGLE_QUOTE = "'";
const DOUBLE_QUOTE = '"';

function escapeSpacesCMD(str) {
  return str.includes(' ') ? `"${str}"` : str;
}

const BACK_SLASH_SPACE = BACK_SLASH + SPACE;
function escapeSpacesShell(str) {
  return str.replace(/ /g, BACK_SLASH_SPACE);
}

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

const SPECIAL_CHARS = /([\^$[\]*.\\])/g;
function escapeInDoubleQuotedRegexp(fragment) {
  return fragment.replace(SPECIAL_CHARS, '\\$1');
}

function isRunningInCMDEXE() {
  return /* istanbul ignore next */ process.platform === 'win32' &&
         /* istanbul ignore next */ !process.env['SHELL'];
}

const UNSAFE_SHELL = /[\s!"#$&'()*;<=>^?`{,}|~[\\\]]/m;
const UNSAFE_CMD = /[\s!"#$&'()*;<=>^?`{,}|~[\]]/m;

/* @see https://unix.stackexchange.com/a/357932 */
function hasUnsafeShellChars(str) {
  return UNSAFE_SHELL.test(str);
}

function autoEscapeShell(str) {
  if (!hasUnsafeShellChars(str)) {
    return str;
  }

  return escapeWithSingleQuotedString(str);
}

function hasUnsafeCMDChars(str) {
  return UNSAFE_CMD.test(str);
}

function autoEscapeCmd(str) {
  if (!hasUnsafeCMDChars(str)) {
    return str;
  }

  return escapeWithDoubleQuotedString(str);
}

function useForwardSlashesCMD(str) {
  return str.split(BACK_SLASH).join(FORWARD_SLASH);
}

function useForwardSlashesShell(str) {
  return str; // already POSIX, so no-op
}

const hasUnsafeChars = isRunningInCMDEXE()
  /* istanbul ignore next */ ? hasUnsafeCMDChars
  /* istanbul ignore next */ : hasUnsafeShellChars;

const autoEscape = isRunningInCMDEXE()
  /* istanbul ignore next */ ? autoEscapeCmd
  /* istanbul ignore next */ : autoEscapeShell;

const escapeSpaces = isRunningInCMDEXE()
  /* istanbul ignore next */ ? escapeSpacesCMD
  /* istanbul ignore next */ : escapeSpacesShell;

const usePosixSlashes = isRunningInCMDEXE()
  /* istanbul ignore next */ ? useForwardSlashesCMD
  /* istanbul ignore next */ : useForwardSlashesShell;

module.exports = {
  escapeInDoubleQuotedString,
  escapeInDoubleQuotedRegexp,
  escapeWithSingleQuotedString,
  escapeWithDoubleQuotedString,
  isRunningInCMDEXE,
  escapeSpaces: Object.assign(escapeSpaces, {
    cmd: escapeSpacesCMD,
    shell: escapeSpacesShell,
  }),
  hasUnsafeChars: Object.assign(hasUnsafeChars, {
    cmd: hasUnsafeCMDChars,
    shell: hasUnsafeShellChars,
  }),
  autoEscape: Object.assign(autoEscape, {
    cmd: autoEscapeCmd,
    shell: autoEscapeShell,
  }),
  useForwardSlashes: Object.assign(usePosixSlashes, {
    cmd: useForwardSlashesCMD,
    shell: useForwardSlashesShell,
  }),
};
