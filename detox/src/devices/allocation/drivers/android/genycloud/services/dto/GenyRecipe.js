const data = Symbol('data');

class GenyRecipe {
  constructor(rawRecipe) {
    this[data] = rawRecipe;
  }

  get uuid() {
    return this[data].uuid;
  }

  get name() {
    return this[data].name || 'Anonymous GMSaaS Recipe';
  }

  toString() {
    return this[data].name ? `${this.name} (${this.uuid})` : `Recipe of ${this.uuid}`;
  }

  toJSON() {
    return this[data];
  }
}

module.exports = GenyRecipe;
