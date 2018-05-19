// Gets a fully qualified class path of espresso and downloads it in a temp dir
const downloadJava = require('./downloadJava');

module.exports = function downloadEspresso(fullyQualifiedClass) {
  const path = fullyQualifiedClass.replace(/\./g, '/');
  return downloadJava(
    `http://android.googlesource.com/platform/frameworks/testing/+/android-support-test/espresso/core/src/main/java/${path}.java?format=TEXT`
  );
};
