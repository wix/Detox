class GenyRecipe {
  constructor(rawRecipe) {
    this.uuid = rawRecipe.uuid;
    this.name = rawRecipe.name;
  }

  toString() {
    return this.name;
  }
}

module.exports = GenyRecipe;
