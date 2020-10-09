const {
  escapeInDoubleQuotedString,
  escapeInDoubleQuotedRegexp,
  isRunningInCMDEXE,
} = require('./shellUtils');

function win32Implementation() {
  const searchRegexpWin32 = (pattern) => `findstr /R /C:"${escapeInDoubleQuotedString(pattern)}"`;
  const searchFragmentWin32 = (fragment) => `findstr /C:"${escapeInDoubleQuotedString(fragment)}"`;

  return {
    escape: {
      inQuotedString: escapeInDoubleQuotedString,
      inQuotedRegexp: escapeInDoubleQuotedRegexp,
    },
    search: {
      regexp: searchRegexpWin32,
      fragment: searchFragmentWin32,
    },
  };
}

function nixImplementation() {
  const searchRegexpNix = (pattern) => `grep "${escapeInDoubleQuotedString(pattern)}"`;
  const searchFragmentNix = (fragment) => `grep -e "${escapeInDoubleQuotedString(fragment)}"`;

  return {
    escape: {
      inQuotedString: escapeInDoubleQuotedString,
      inQuotedRegexp: escapeInDoubleQuotedRegexp,
    },
    search: {
      regexp: searchRegexpNix,
      fragment: searchFragmentNix,
    },
  };
}

module.exports = isRunningInCMDEXE()
  ? win32Implementation()
  : nixImplementation();
