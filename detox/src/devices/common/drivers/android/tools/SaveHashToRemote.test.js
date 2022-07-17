const { saveHashToRemote } = require('./SaveHashToRemote');
let adb;
let tempFileTransfer;

describe('SaveHashToRemote', () => {
  const mockDeviceId = '123';
  const mockHash = 'abcdef';
  const mockBundleId = 'com.android.test';

  beforeEach(() => {
    const ADBMock = jest.genMockFromModule('../exec/ADB');
    adb = new ADBMock();
    adb.readFile.mockImplementation(() => Promise.resolve(mockHash));
    const { TempFileTransfer } = jest.genMockFromModule('./TempFileTransfer');
    tempFileTransfer = new TempFileTransfer(adb);
  });

  it('should save hash remotely and delete local hash file', async () => {
    const hashFile = `${mockBundleId}.hash`;
    const fs = require('fs');
    const writeFileSpy = jest.spyOn(fs, 'writeFileSync');
    const deleteFileSpy = jest.spyOn(fs, 'unlinkSync');

    const params = {
      tempFileTransfer,
      deviceId: mockDeviceId,
      bundleId: mockBundleId,
      hash: mockHash
    };

    await saveHashToRemote(params);
    await expect(writeFileSpy).toHaveBeenCalledTimes(1);
    await expect(writeFileSpy).toHaveBeenCalledWith(hashFile, mockHash);
    await expect(tempFileTransfer.send).toHaveBeenCalledTimes(1);
    await expect(tempFileTransfer.send).toHaveBeenCalledWith(mockDeviceId, hashFile, hashFile);
    await expect(deleteFileSpy).toHaveBeenCalledTimes(1);
  });
});
