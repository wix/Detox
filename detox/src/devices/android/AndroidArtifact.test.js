const AndroidArtifact = require('./AndroidArtifact');
const ADB = require('./ADB');

describe('AndroidArtifact', () => {
  let adb;
  let deviceId;

  beforeEach(() => {
    deviceId = Math.random();
    adb = new ADB();
    jest.spyOn(adb, 'adbCmd').mockReturnValue();
  });

  it('copies file by pulling', async () => {
    const aa = androidArtifact('/sdcard/a.txt');
    await aa.copy('/tmp/b.log');
    expect(adb.adbCmd).toBeCalledWith(deviceId, `pull "/sdcard/a.txt" "/tmp/b.log"`);
  });

  it('moves file by pulling and removing it', async () => {
    const aa = androidArtifact('/sdcard/a.txt');
    await aa.move('/tmp/b.log');
    expect(adb.adbCmd).toBeCalledWith(deviceId, `pull "/sdcard/a.txt" "/tmp/b.log"`);
    expect(adb.adbCmd).toBeCalledWith(deviceId, `shell rm -f "/sdcard/a.txt"`);
  });

  function androidArtifact(path) {
    return new AndroidArtifact(path, adb, deviceId);
  }
});

