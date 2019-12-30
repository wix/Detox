class Holder {
  constructor() {
    this._instance = null;
  }

  set instance(value) {
    this._instance = value;
  }

  get instance() {
    return this._instance;
  }
}

module.exports = new Holder();
