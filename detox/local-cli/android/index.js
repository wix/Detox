const { execSync } = require('child_process');
const log = require('../../src/utils/logger').child({ __filename });
const fs = require('fs');
const { createFile } = require('../utils/misc');
const path = require('path');

// TODO [amitd] what if calls to createFile() fail (silently)?

// TODO [amitd] make this non-global? maybe use a class for this...
let packageName, minSdkVersion;

function build(androidDir) {
    log.info('Building android');

    // TODO: should we do something different for release?
    execSync(`cd ${androidDir} && ./gradlew clean app:assembleDebug`); // TODO [amitd] If applicable, find the more specific gradle task that does this. Note: it must be build-flavours agnostic...
}

function findInfo(androidDir) {
    log.info('Finding information');

    const mergedJsonLocation = path.join(androidDir, 'app', 'build', 'intermediates', 'merged_manifests', 'debug', 'output.json'); // TOOD what about build flavours...
    const mergedJson = JSON.parse(fs.readFileSync(mergedJsonLocation, 'utf-8'));
    packageName = mergedJson[0].properties.packageId;
    minSdkVersion = mergedJson[0].properties.minSdkVersion;
}

function createDetoxTest(androidDir) {
    log.info('Creating DetoxTest');

    let DetoxTestFile = fs.readFileSync(path.join(__dirname, 'DetoxTest.java'), 'utf-8');
    DetoxTestFile = DetoxTestFile.replace(/{PACKAGE_NAME_PLACEHOLDER}/g, packageName);

    const detoxTestFolder = `${androidDir}/app/src/androidTest/java/${packageName.split('.').join('/')}`;
    fs.mkdirSync(detoxTestFolder, {recursive: true});
    createFile(`${detoxTestFolder}/DetoxTest.java`, DetoxTestFile);
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

    let detoxAndroidBuildGradle = fs.readFileSync(path.join(__dirname, 'detox.android.build.gradle'), 'utf-8');
    const detoxAppBuildGradle = fs.readFileSync(path.join(__dirname, 'detox.app.build.gradle'), 'utf-8');
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

function androidInit(androidDir) {
    try {
        log.info('Now scaffolding Android configuration...')

        // TODO [amitd] find a way to skip build() altogether. The main point is to have the merged_manifests/.../output.json generated
        //   in order to be able to extract the package name and min-sdk version in findInfo(). There ought to be a lighter way...
        build(androidDir);
        findInfo(androidDir);
        createDetoxTest(androidDir);
        modifyBuildGradle(androidDir);

        log.info('Android configuration completed!')
    } catch (e) {
        log.error('Android scaffolding failed (Note: it can be skipped by specifying the --skipAndroid argument)', e);
    }
}

module.exports = {
    androidInit,
};
