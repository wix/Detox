const fs = require('fs');
const path = require('path');

const rnMinor = require('../src/utils/rn-consts/rn-consts').rnVersion.minor;

function getGradleVersionByRNVersion() {
  switch (rnMinor) {
    default:
      return '8.10.2';
    case '75':
      return '8.8';
    case '74':
      return '8.6';
    case '73':
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
function patchGradleByRNVersion() {
  updateGradleWrapperSync();
  patchSettingsGradle();
  patchGradlePropertiesSync();
}

/**
 * By default gralde.properties has new arch enabled. Disable it by adding evn var
 */
function patchGradlePropertiesSync() {
  // Read the evn var to check if the new arch is enabled
  let isNewArch;

  if (!process.env.ENABLE_NEW_ARCH) {
    isNewArch = true;
  } else {
    isNewArch = process.env.ENABLE_NEW_ARCH === 'true';
  }

  function readGradlePropertiesFile() {
    const gradlePropertiesFile = path.join(process.cwd(), 'android', 'gradle.properties');
    console.log(`Patching gradle.properties. File: ${gradlePropertiesFile}`);
    const data = fs.readFileSync(gradlePropertiesFile, 'utf8');
    return { gradlePropertiesFile, data };
  }

  function writeGradlePropertiesFile(gradlePropertiesFile, data) {
    const updatedData = data.replace('newArchEnabled=true', 'newArchEnabled=false');
    fs.writeFileSync(gradlePropertiesFile, updatedData, 'utf8');
    console.log('gradle.properties patched successfully.');
  }

  if (!isNewArch) {
    try {
      const { gradlePropertiesFile, data } = readGradlePropertiesFile();
      writeGradlePropertiesFile(gradlePropertiesFile, data);
    } catch (e) {
      console.error('Error:', e);
    }
  }
}

/**
 * In RN75 and above the settings.gradle file should contain the following lines. We can't wrap them in 'if' statement
 * because they should be the first line in the settings file. This patch could be safely removed after dropping support
 * for RN74.
 */
function patchSettingsGradle() {
  if (parseInt(rnMinor) >= 75) {
    return;
  }

  const settingsGradlePath = path.join(process.cwd(), 'android', 'settings.gradle');
  console.log(`Patching settings.gradle. File: ${settingsGradlePath}`);

  try {
    let data = fs.readFileSync(settingsGradlePath, 'utf8');
    const blockRegex = /\/\/ RN75\+_BLOCK_START[\s\S]*?\/\/ RN75\+_BLOCK_END/g;

    // Replace the block with an empty string
    const updatedData = data.replace(blockRegex, '');

    fs.writeFileSync(settingsGradlePath, updatedData, 'utf8');
    console.log('settings.gradle patched successfully.');
  } catch (err) {
    console.error('Error:', err);
  }
}

/**
 * Update the Gradle wrapper to the specified version.
 */
function updateGradleWrapperSync() {
  const newVersion = getGradleVersionByRNVersion();

  const gradleWrapperPath = path.join(process.cwd(), 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');
  console.log(`Updating Gradle wrapper to version$ {newVersion}. File: ${gradleWrapperPath}`);

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
  patchGradleByRNVersion: patchGradleByRNVersion
};
