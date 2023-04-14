describe('Device-handle', () => {

  let DeviceHandle;
  beforeEach(() => {
    DeviceHandle = require('./DeviceHandle');
  });

  const deviceHandle = (adbName, status) => new DeviceHandle(`${adbName}\t${status}`);

  it('should extract the device\'s adb name', () => {
    const uut = deviceHandle('mockdevice', 'online');
    expect(uut.adbName).toEqual('mockdevice');
  });

  it('should extract the device status', () => {
    const uut = deviceHandle('mockdevice', 'mockstatus');
    expect(uut.status).toEqual('mockstatus');
  });

  it('should deduce: device-type = emulator', () => {
    expect(deviceHandle('emulator-5554', 'mockstatus').type).toEqual('emulator');
  });

  it('should deduce: device-type = genymotion', () => {
    expect(deviceHandle('127.0.0.1:1234', 'mockstatus').type).toEqual('genymotion');
    expect(deviceHandle('192.168.60.101:6666', 'mockstatus').type).toEqual('genymotion');
  });

  it('should deduce: device-type = device, as the default', () => {
    expect(deviceHandle('MOCK_SERIAL', 'mockstatus').type).toEqual('device');
  });
});
