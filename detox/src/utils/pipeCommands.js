const SPECIAL_CHARS = /([\^\$\[\]\*\.\\])/g;

const escapeInQuotedString = (fragment) => fragment.replace(/"/g, '\\"');
const escapeInQuotedRegexp = (fragment) => fragment.replace(SPECIAL_CHARS, "\\$1");

function win32Implementation() {
  const searchRegexpWin32 = (pattern) => `findstr /R /C:"${escapeInQuotedString(pattern)}"`;
  const searchFragmentWin32 = (fragment) => `findstr /C:"${escapeInQuotedString(fragment)}"`;

  return {
    escape: {
      inQuotedString: escapeInQuotedString,
      inQuotedRegexp: escapeInQuotedRegexp,
    },
    search: {
      regexp: searchRegexpWin32,
      fragment: searchFragmentWin32,
    },
  };
}

function nixImplementation() {
  const searchRegexpNix = (pattern) => `grep "${escapeInQuotedString(pattern)}"`;
  const searchFragmentNix = (fragment) => `grep -e "${escapeInQuotedString(fragment)}"`;

  return {
    escape: {
      inQuotedString: escapeInQuotedString,
      inQuotedRegexp: escapeInQuotedRegexp,
    },
    search: {
      regexp: searchRegexpNix,
      fragment: searchFragmentNix,
    },
  };
}

const isRunningInCMDEXE = process.platform === 'win32' && !process.env['SHELL'];

module.exports = isRunningInCMDEXE
  ? win32Implementation()
  : nixImplementation();
