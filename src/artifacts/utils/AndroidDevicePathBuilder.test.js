const AndroidDevicePathBuilder = require('./AndroidDevicePathBuilder');

describe(AndroidDevicePathBuilder, () => {
  it('should generate process id dependent paths with a counter', () => {
    const date = new Date(2015, 5, 15, 15, 2, 58);
    const builder = new AndroidDevicePathBuilder(date);

    expect(builder.buildTemporaryArtifactPath('.png')).toMatchSnapshot();
    expect(builder.buildTemporaryArtifactPath('.png')).toMatchSnapshot();
  });

  it('should generate current timestamp string by default', () => {
    const builder = new AndroidDevicePathBuilder();
    expect(builder.buildTemporaryArtifactPath('.log')).toMatch(/^\/sdcard\/\d+_\d+\.log$/);
  });
});

