#!/usr/bin/env node

// Javascript for windows support.

const fs = require('fs-extra');
const Path = require('path');
const childProcess = require('child_process');

function resolve(path) {
    return Path.resolve(__dirname, '..', path);
}

if (process.platform === 'darwin') {
    console.log("\nPackaging Detox iOS sources");

    fs.removeSync(resolve('Detox-ios-src.tbz'));
    // Prepare Earl Grey without building
    childProcess.execFileSync(resolve('ios/EarlGrey/Scripts/setup-earlgrey.sh'), {
        stdio: ['ignore', 'ignore', 'inherit'],
    });
    childProcess.execSync('find ./ios -name Build -type d -exec rm -rf {} \\;', {
        stdio: ['ignore', 'ignore', 'inherit'],
    });

    childProcess.execSync('tar -cjf ../Detox-ios-src.tbz .', {
        cwd: 'ios',
        stdio: ['ignore', 'inherit', 'inherit'],
    });
}

if (process.argv[2] === 'android' || process.argv[3] === 'android') {
    console.log("\nBuilding Detox aars");
    const aars = [
        'detox-minReactNative44-debug.aar',
        'detox-minReactNative46-debug.aar',
        'detox-minReactNative44-release.aar',
        'detox-minReactNative46-release.aar',
    ];
    aars.forEach(aar => {
        fs.removeSync(resolve(aar));
    });

    childProcess.execFileSync(resolve('android/gradlew'), ['assembleDebug', 'assembleRelease'], {
        cwd: 'android',
        stdio: 'inherit',
        shell: true,
    });

    aars.forEach(aar => {
        fs.copySync(
            resolve(`android/detox/build/outputs/aar/${aar}`),
            resolve(aar));
    });
}
