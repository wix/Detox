describe('Emulator handle', () => {

  let EmulatorHandle;
  let EmulatorTelnet;
  beforeEach(() => {
    jest.mock('./EmulatorTelnet');
    EmulatorTelnet = require('./EmulatorTelnet');
    EmulatorHandle = require('./EmulatorHandle');
  });

  const emulatorHandle = (adbName, status) => new EmulatorHandle(`${adbName}\t${status}`);

  it('should extract the name and status', () => {
    const uut = emulatorHandle('emulator-6667', 'mock-status');
    expect(uut.adbName).toEqual('emulator-6667');
    expect(uut.status).toEqual('mock-status');
  });

  it('should extract the emulator\'s port', () => {
    const uut = emulatorHandle('emulator-1234', 'offline');
    expect(uut.port).toEqual('1234');
  });

  describe('Device name querying via telnet', () => {
    let uut;
    let telnet;
    beforeEach(() => {
      uut = emulatorHandle('emulator-2345', 'offline');
      telnet = EmulatorTelnet.mock.instances[0];
    });

    it('should telnet-connect', async () => {
      await uut.queryName();
      expect(telnet.connect).toHaveBeenCalledWith('2345');
    });

    it('should fail if telnet-connect fails', async () => {
      telnet.connect.mockRejectedValue(new Error('mock telnet error'));
      await expect(uut.queryName()).rejects.toThrowError();
    });

    it('should return name from telnet command', async () => {
      const avdName = 'mock AVD';
      telnet.avdName.mockReturnValue(avdName);

      const result = await uut.queryName();
      expect(result).toEqual(avdName);
    });

    it('should close telnet when done', async () => {
      await uut.queryName();
      expect(telnet.quit).toHaveBeenCalled();
    });

    it('should close telnet even if name resolution fails', async () => {
      telnet.avdName.mockRejectedValue(new Error('mock name resolution error'));

      await expect(uut.queryName()).rejects.toThrowError();
      expect(telnet.quit).toHaveBeenCalled();
    });

    it('should only query once', async () => {
      const avdName = 'mock AVD';
      telnet.avdName
        .mockReturnValueOnce(avdName)
        .mockReturnValueOnce('some other name');

      await uut.queryName();
      const result = await uut.queryName();
      expect(result).toEqual(avdName);
      expect(telnet.avdName).toHaveBeenCalledTimes(1);
    });
  });
});
