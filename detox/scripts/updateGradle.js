const fs = require('fs');
const path = require('path');

const rnMinor = require('../src/utils/rn-consts/rn-consts').rnVersion.minor;

function getGradleVersionByRNVersion() {
  switch (rnMinor) {
    default:
      return '8.3';
    case '72':
      return '8.0';
    case '71':
      return '7.6.1';
  }
}

/**
 * Update the Gradle wrapper to the version that matches the React Native version.
 */
function setGradleVersionByRNVersion() {
  const gradleVersion = getGradleVersionByRNVersion();
  updateGradleWrapperSync(gradleVersion);
}

/**
 * Update the Gradle wrapper to the specified version.
 *
 * @param {string} newVersion - the new Gradle wrapper version
 */
function updateGradleWrapperSync(newVersion) {
  const gradleWrapperPath = path.join(process.cwd(), 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');
  console.log(`Updating Gradle wrapper to version${newVersion}. File: ${gradleWrapperPath}`);

  try {
    let data = fs.readFileSync(gradleWrapperPath, 'utf8');
    let updatedData = data.replace(/distributionUrl=.+\n/, `distributionUrl=https\\://services.gradle.org/distributions/gradle-${newVersion}-bin.zip\n`);

    fs.writeFileSync(gradleWrapperPath, updatedData, 'utf8');
    console.log(`Gradle wrapper updated successfully to version ${newVersion}.`);
  } catch (err) {
    console.error('Error:', err);
  }
}

module.exports = {
  setGradleVersionByRNVersion
};
