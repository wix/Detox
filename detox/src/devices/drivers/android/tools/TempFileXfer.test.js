describe('Temp file transfer', () => {
  let adb;
  let uut;
  beforeEach(() => {
    const ADB = jest.genMockFromModule('../exec/ADB');
    adb = new ADB();

    const TempFileXfer = require('./TempFileXfer');
    uut = new TempFileXfer(adb);
  });

  it('should use the default temp-dir', async () => {
    await uut.prepareDestinationDir('device-id');

    expect(adb.shell).toHaveBeenCalledWith('device-id', `rm -fr /data/local/tmp/detox`);
  });
});
