const fs = require('fs-extra');
const { ssim } = require('ssim.js');
const { PNG } = require('pngjs');

// Threshold for SSIM comparison, if two images have SSIM score below this threshold, they are considered different.
const SSIM_SCORE_THRESHOLD = 0.997;

async function expectElementSnapshotToMatch (elementOrDevice, snapshotName) {
    const bitmapPath = await elementOrDevice.takeScreenshot(snapshotName);
    const expectedBitmapPath = `./e2e/assets/${snapshotName}.${device.getPlatform()}.png`;

    if (await fs.pathExists(expectedBitmapPath) === false || process.env.UPDATE_SNAPSHOTS === 'true') {
        await fs.copy(bitmapPath, expectedBitmapPath, {overwrite: true});
    } else {
        await expectSSIMToBeClose(bitmapPath, expectedBitmapPath);
    }
}

async function expectDeviceSnapshotToMatch (snapshotName) {
    // Set status bar to consistent state for snapshot. Currently, doesn't work on iOS 17.
    await device.setStatusBar({time: '2024-03-08T09:41:00-07:00'});

    await expectElementSnapshotToMatch(device, snapshotName);
}

async function expectSSIMToBeClose (bitmapPath, expectedBitmapPath) {
    const image = loadImage(bitmapPath);
    const expectedImage = loadImage(expectedBitmapPath);

    const { mssim, performance } = ssim(image, expectedImage);

    if (mssim < SSIM_SCORE_THRESHOLD) {
        throw new Error(
            `Expected bitmaps at '${bitmapPath}' and '${expectedBitmapPath}' to have an SSIM score ` +
            `of at least ${SSIM_SCORE_THRESHOLD}, but got ${mssim}. This means the snapshots are different ` +
            `(comparison took ${performance}ms)`
        )
    }
}

function loadImage (path) {
    const imageBuffer = fs.readFileSync(path);
    const image = PNG.sync.read(imageBuffer);
    return convertToSSIMFormat(image);
}

function convertToSSIMFormat (image) {
    return {
        data: new Uint8Array(image.data),
        width: image.width,
        height: image.height,
    };
}

module.exports = {
    expectElementSnapshotToMatch,
    expectDeviceSnapshotToMatch
};
