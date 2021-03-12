class Platform {
  constructor() {
    this.name = null;
    this.device = null;
  }

  get(entry) {
    return this[entry];
  }

  set(type, device) {
    this.name = type.split('.')[0];
    this.device = device;
  }
}

const platform = new Platform();

module.exports = platform;