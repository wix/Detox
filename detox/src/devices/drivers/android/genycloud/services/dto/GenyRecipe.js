const _ = require('lodash');

class Recipe {
  constructor(rawRecipe) {
    Object.assign(this, _.pick(rawRecipe, 'uuid', 'name'));
  }

  toString() {
    return this.name;
  }
}

module.exports = Recipe;
