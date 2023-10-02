const DeviceList = require('./DeviceList'); // Update with the actual path

describe('DeviceList', () => {
  let deviceList;

  beforeEach(() => {
    deviceList = new DeviceList([{ id: 'device1' }, { id: 'device2' }]);
  });

  it('should concat with another list', () => {
    const other = new DeviceList([{ id: 'device3' }]);
    const concatenated = deviceList.concat(other);
    expect(concatenated.getIds()).toEqual(['device1', 'device2', 'device3']);
  });

  it('should concat with empty list', () => {
    const other = new DeviceList();
    const concatenated = deviceList.concat(other);
    expect(concatenated.getIds()).toEqual(['device1', 'device2']);
  });

  it('should return device ids', () => {
    expect(deviceList.getIds()).toEqual(['device1', 'device2']);
  });

  it('should check if a device id is included', () => {
    expect(deviceList.includes('device1')).toBe(true);
    expect(deviceList.includes('unknownDevice')).toBe(false);
  });

  it('should filter devices', () => {
    const filteredList = deviceList.filter(device => device.id === 'device1');
    expect(filteredList.getIds()).toEqual(['device1']);
  });

  it('should add a new device', () => {
    deviceList.add('device3', { prop: 'value' });
    expect(deviceList.includes('device3')).toBe(true);
  });

  it('should delete a device', () => {
    deviceList.delete('device1');
    expect(deviceList.includes('device1')).toBe(false);
  });
});
