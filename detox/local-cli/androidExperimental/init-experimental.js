const {execSync} = require('child_process');
const log = require('../../src/utils/logger').child({ __filename });
const fs = require('fs');
const {createFile} = require('../utils/misc');
let packageName, minSdkVersion;

function build(androidDir) {
    log.info('Building android');
    // TODO: should we do something different for release?
    execSync(`cd ${androidDir} && ./gradlew clean app:assembleDebug`);
}

function findInfo(androidDir) {
    log.info('Finding information');
    const mergedJsonLocation = `${androidDir}/app/build/intermediates/merged_manifests/debug/output.json`;
    const mergedJson = JSON.parse(fs.readFileSync(mergedJsonLocation, 'utf-8'));
    packageName = mergedJson[0].properties.packageId;
    minSdkVersion = mergedJson[0].properties.minSdkVersion;
}

function createDetoxTest(androidDir) {
    log.info('Creating DetoxTest');
    let DetoxTest = fs.readFileSync('node_modules/detox/local-cli/androidExperimental/DetoxTest.java', 'utf-8');
    DetoxTest = DetoxTest.replace(/com.example/g, packageName);
    const detoxTestFolder = `${androidDir}/app/src/androidTest/java/${packageName.split('.').join('/')}`;
    fs.mkdirSync(detoxTestFolder, {recursive: true});
    createFile(`${detoxTestFolder}/DetoxTest.java`, DetoxTest);
}

function applyBuildGradle(androidDir, extraDir, detoxBuildGradle) {
    createFile(`${androidDir}${extraDir}/detox.build.gradle`, detoxBuildGradle);
    let buildGradle = fs.readFileSync(`${androidDir}${extraDir}/build.gradle`, 'utf-8');
    buildGradle += `apply from: 'detox.build.gradle'\n\n`;
    fs.writeFileSync(`${androidDir}${extraDir}/build.gradle`, buildGradle); // just modifying, do not call createFile
}

function modifyBuildGradle(androidDir) {
    // TODO: We currently do not support projects which already have kotlin (larger than our 1.3.10)
    log.info('Modifying build.gradle');
    let detoxAndroidBuildGradle = fs.readFileSync('node_modules/detox/local-cli/androidExperimental/detox.android.build.gradle', 'utf-8');
    const detoxAppBuildGradle = fs.readFileSync('node_modules/detox/local-cli/androidExperimental/detox.app.build.gradle', 'utf-8');
    if (minSdkVersion < 18) {
        log.warn(`Please be aware that the minSdkVersion needs to be at least 18 (you have it set to ${minSdkVersion}, it will be modified).`);
    } else {
        detoxAndroidBuildGradle = detoxAndroidBuildGradle.split('\n').filter(function(line){ 
            return line.indexOf('minSdkVersion') == -1;
        }).join('\n')
    }

    applyBuildGradle(androidDir, '', detoxAndroidBuildGradle);
    applyBuildGradle(androidDir, '/app', detoxAppBuildGradle);
}

function experimentalAndroidInit(androidDir) {
    try {
        build(androidDir);
        findInfo(androidDir);
        createDetoxTest(androidDir);
        modifyBuildGradle(androidDir);
    } catch (e) {
        log.error(`experimentalAndroidInit: ${e}`);
    }
}

module.exports = {
    experimentalAndroidInit
};
