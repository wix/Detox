const _ = require('lodash');

class GenyRecipeQuerying {
  constructor(recipesService) {
    this.recipesService = recipesService;
  }

  async getRecipeFromQuery(deviceQuery) {
    const queryObj = _.isPlainObject(deviceQuery) ? deviceQuery : { recipeName: deviceQuery };
    if (queryObj.recipeUUID) {
      return this.recipesService.getRecipeByUUID(queryObj.recipeUUID);
    }
    return this.recipesService.getRecipeByName(queryObj.recipeName);
  }
}

module.exports = GenyRecipeQuerying;
