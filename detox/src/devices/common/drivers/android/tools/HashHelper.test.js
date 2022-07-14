let uut;
let adb;
let tempfilexfer;

describe('HashHelper', () => {
  const mockDeviceId = '123';
  const mockPath = '/data/local/tmp/detox';
  const mockHash = 'abcdef';
  const mockBundleId = 'com.android.test';
  const HashHelper = require('./HashHelper');

  beforeEach(() => {
    const ADBMock = jest.genMockFromModule('../exec/ADB');
    adb = new ADBMock();
    adb.readFile.mockImplementation(() => Promise.resolve(mockHash));
    const TempFileXfer = jest.genMockFromModule('./TempFileXfer');
    tempfilexfer = new TempFileXfer(adb);
    tempfilexfer.getFilePath.mockImplementation(() => mockPath);

    uut = new HashHelper(adb, tempfilexfer);
  });

  it('should save hash remotely and delete local hash file', async () => {
    const hashFile = `${mockBundleId}.hash`;
    const fs = require('fs');
    const writeFileSpy = jest.spyOn(fs, 'writeFileSync');
    const deleteFileSpy = jest.spyOn(fs, 'unlinkSync');

    await uut.saveHashToRemote(mockDeviceId, mockBundleId, mockHash);
    await expect(writeFileSpy).toHaveBeenCalledTimes(1);
    await expect(writeFileSpy).toHaveBeenCalledWith(hashFile, mockHash);
    await expect(tempfilexfer.send).toHaveBeenCalledTimes(1);
    await expect(tempfilexfer.send).toHaveBeenCalledWith(mockDeviceId, hashFile, hashFile);
    await expect(deleteFileSpy).toHaveBeenCalledTimes(1);
  });
});
