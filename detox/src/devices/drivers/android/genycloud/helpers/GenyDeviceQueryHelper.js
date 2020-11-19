const _ = require('lodash');

class GenyDeviceQueryHelper {
  constructor(recipesService) {
    this.recipesService = recipesService;
  }

  async getRecipeFromQuery(deviceQuery) {
    const deviceObj = _.isPlainObject(deviceQuery) ? deviceQuery : { recipeName: deviceQuery }
    if (deviceObj.recipeUUID) {
      return this.recipesService.getRecipeByUUID(deviceObj.recipeUUID);
    }
    return this.recipesService.getRecipeByName(deviceObj.recipeName);
  }
}

module.exports = GenyDeviceQueryHelper;
