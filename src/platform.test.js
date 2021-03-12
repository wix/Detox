const platform = require('./platform');

describe('exportWrapper', () => {
  const mockDevice = {};

  it(`stores platform specific device`, async () => {
    platform.set('ios.none', mockDevice);

    expect(platform.get('device')).toBe(mockDevice);
  });

  it(`stores platform name`, async () => {
    platform.set('ios.none', mockDevice);

    expect(platform.get('name')).toBe('ios');
  });
});
