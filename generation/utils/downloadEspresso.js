// Gets a fully qualified class path of espresso and downloads it in a temp dir
const downloadFile = require('./downloadFile');

module.exports = function downloadEspresso(fullyQualifiedClass) {
  const path = fullyQualifiedClass.replace(/\./g, '/');
  return downloadFile(`https://raw.githubusercontent.com/android/android-test/androidx-test-1.1.0/espresso/core/java/${path}.java`);
};
