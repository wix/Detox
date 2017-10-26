class Platform {
  constructor() {
    this.name = null;
    this.device = null;
  }

  set(type, device) {
    this.name = type.split('.')[0];
    this.device = device;
  }

  get(entry) {
    return this[entry];
  }
}

module.exports = {platform: new Platform()};