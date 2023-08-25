const DeviceList = require('./DeviceList');

describe('DeviceList', () => {
  it('should be able to create an empty list', () => {
    const list = new DeviceList();
    expect([...list]).toEqual([]);
  });

  it('should be able to create a list with devices', () => {
    const list = new DeviceList([{ id: '1' }, { id: '2' }]);
    expect([...list]).toEqual([{ id: '1' }, { id: '2' }]);
    expect(list.includes('0')).toBe(false);
    expect(list.includes('1')).toBe(true);
    expect(list.includes('2')).toBe(true);
  });
});
