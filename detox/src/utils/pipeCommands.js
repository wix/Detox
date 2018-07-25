function win32Implementation() {
  const escapeInQuotedStringWin32 = (fragment) => fragment.replace(/"/g, '""');
  const escapeInQuotedRegexpWin32 = escapeInQuotedStringWin32;
  const searchRegexpWin32 = (pattern) => `findstr /R /C:"${escapeInQuotedStringWin32(pattern)}"`;
  const searchFragmentWin32 = (fragment) => `findstr /C:"${escapeInQuotedStringWin32(fragment)}"`;

  return {
    escape: {
      inQuotedString: escapeInQuotedStringWin32,
      inQuotedRegexp: escapeInQuotedRegexpWin32,
    },
    search: {
      regexp: searchRegexpWin32,
      fragment: searchFragmentWin32,
    },
  };
}

function nixImplementation() {
  const SPECIAL_CHARS = /(["\^\$\[\]\*\.\\])/g;

  const escapeInQuotedStringNix = (fragment) => fragment.replace(/"/g, '\\"');
  const escapeInQuotedRegexpNix = (fragment) => fragment.replace(SPECIAL_CHARS, "\\$1");
  const searchRegexpNix = (pattern) => `grep "${escapeInQuotedStringNix(pattern)}"`;
  const searchFragmentNix = (fragment) => `grep -e "${escapeInQuotedStringNix(fragment)}"`;

  return {
    escape: {
      inQuotedString: escapeInQuotedStringNix,
      inQuotedRegexp: escapeInQuotedRegexpNix,
    },
    search: {
      regexp: searchRegexpNix,
      fragment: searchFragmentNix,
    },
  };
}

module.exports = process.platform === 'win32'
  ? win32Implementation()
  : nixImplementation();
