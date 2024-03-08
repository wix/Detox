const fs = require('fs-extra');

const expectElementSnapshotToMatch = async function (element, snapshotName) {
    const bitmapPath = await element.takeScreenshot(snapshotName);
    const expectedBitmapPath = `./e2e/assets/${snapshotName}.${device.getPlatform()}.png`;
    if (await fs.pathExists(expectedBitmapPath) === false || process.env.UPDATE_SNAPSHOTS === 'true') {
        await fs.copyFile(bitmapPath, expectedBitmapPath, {overwrite: true});
    }

    expectBitmapsToBeEqual(bitmapPath, expectedBitmapPath);
}

const expectDeviceSnapshotToMatch = async function (snapshotName) {
    // Set status bar to consistent state for snapshot. Currently, doesn't work on iOS 17.
    await device.setStatusBar({time: '2024-03-08T09:41:00-07:00'});
    await expectElementSnapshotToMatch(device, snapshotName);
}

function expectBitmapsToBeEqual(bitmapPath, expectedBitmapPath) {
    const bitmapBuffer = fs.readFileSync(bitmapPath);
    const expectedBitmapBuffer = fs.readFileSync(expectedBitmapPath);

    if (!bitmapBuffer.equals(expectedBitmapBuffer)) {
        throw new Error(
            `Expected bitmap at ${bitmapPath} to be equal to ${expectedBitmapPath}, but it is different!`);
    }
}

module.exports = {
    expectElementSnapshotToMatch,
    expectDeviceSnapshotToMatch
};
