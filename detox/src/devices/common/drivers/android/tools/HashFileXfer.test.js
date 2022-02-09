let uut;
let adb;

describe('hash file transfer', () => {
  it('should pass correct params to read hash file', () => {
    const HashFileXfer = require('./HashFileXfer');
    const ADB = jest.genMockFromModule('../exec/ADB');
    adb = new ADB();
    adb.readFile.mockImplementation(() => jest.fn());
    uut = new HashFileXfer(adb);

    const mockDeviceId = 'emulator-5556';
    const mockBundleId = 'com.android.test';

    uut.readHashFile(mockDeviceId, mockBundleId);
    expect(adb.readFile).toHaveBeenCalledTimes(1);
    expect(adb.readFile).toHaveBeenCalledWith(mockDeviceId, `/data/local/tmp/detox/${mockBundleId}.hash`)
  });
});
