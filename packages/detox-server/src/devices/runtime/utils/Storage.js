const _ = require('lodash');

class Storage {
  constructor() {
    this._map = {};
  }

  keys() {
    return Object.keys(this._map);
  }

  get() {
    return _.cloneDeep(this._map);
  }

  assign(map) {
    if (_.isEmpty(map)) {
      return;
    }

    for (const key of Object.keys(map)) {
      this.set(key, map[key]);
    }
  }

  set(key, value) {
    if (value != null) {
      this._map[key] = value;
    } else {
      this.remove(key);
    }
  }

  reset() {
    for (const key of this.keys()) {
      this.remove(key);
    }
  }

  remove(key) {
    delete this._map[key];
  }
}

module.exports = Storage;
