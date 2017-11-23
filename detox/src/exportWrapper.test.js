const iosExports = require('./ios/expect');
const androidExports = require('./android/expect');
const exportWrapper = require('./exportWrapper');
const platform = require('./platform');

describe('exportWrapper', () => {
  const mockDevice = {};

  it(`exports ios specific objects`, async () => {
    platform.set('ios.none', mockDevice);

    expect(exportWrapper.device).toBe(mockDevice);
    expect(exportWrapper.expect).toBe(iosExports.expect);
    expect(exportWrapper.element).toBe(iosExports.element);
    expect(exportWrapper.waitFor).toBe(iosExports.waitFor);
    expect(exportWrapper.by).toBe(iosExports.by);
  });

  it(`exports android specific objects`, async () => {
    platform.set('android.attached', mockDevice);

    expect(exportWrapper.device).toBe(mockDevice);
    expect(exportWrapper.expect).toBe(androidExports.expect);
    expect(exportWrapper.element).toBe(androidExports.element);
    expect(exportWrapper.waitFor).toBe(androidExports.waitFor);
    expect(exportWrapper.by).toBe(androidExports.by);
  });
});
