class GenyRecipe {
  constructor(rawRecipe) {
    this.uuid = rawRecipe.uuid;
    this.name = rawRecipe.name || 'Anonymous GMSaaS Recipe';
    this._description = (rawRecipe.name ? `${this.name} (${this.uuid})` : `Recipe of ${this.uuid}`);
  }

  toString() {
    return this._description;
  }
}

module.exports = GenyRecipe;
