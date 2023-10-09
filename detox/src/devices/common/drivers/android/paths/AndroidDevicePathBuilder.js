class AndroidDevicePathBuilder {
  constructor(time = new Date()) {
    // NOTE: this is a workaround for Jest workers + Android
    this.prefix = `${time.getHours()}${time.getMinutes()}${time.getSeconds()}${time.getMilliseconds()}`;
    this.counter = 0;
  }

  buildTemporaryArtifactPath(extension) {
    return `/sdcard/${this.prefix}_${this.counter++}${extension}`;
  }
}

module.exports = AndroidDevicePathBuilder;

