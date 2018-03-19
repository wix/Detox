#!/usr/bin/env node

// Javascript for windows support.

const fs = require('fs-extra');
const childProcess = require('child_process');

if (process.platform === 'darwin') {
    console.log("\nPackaging Detox iOS sources");

    fs.removeSync('Detox-ios-src.tbz');
    // Prepare Earl Grey without building
    childProcess.execFileSync('ios/EarlGrey/Scripts/setup-earlgrey.sh', {
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
        fs.removeSync(aar);
    });

    childProcess.execFileSync('android/gradlew', ['assembleDebug', 'assembleRelease'], {
        cwd: 'android',
        stdio: 'inherit',
        shell: true,
    });

    aars.forEach(aar => {
        fs.copySync(`android/detox/build/outputs/aar/${aar}`, aar);
    });
}
