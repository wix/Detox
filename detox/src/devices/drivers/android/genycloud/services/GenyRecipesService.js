const Recipe = require('./dto/GenyRecipe');

class GenyRecipesService {
  constructor(genyCloudExec, logger) {
    this.genyCloudExec = genyCloudExec;
    this.logger = logger;
  }

  async getRecipeByName(recipeName) {
    const result = await this.genyCloudExec.getRecipe(recipeName);
    const { recipes } = result;
    if (!recipes.length) {
      return null;
    }

    if (recipes.length > 1) {
      this.logger.warn({ event: 'GENYCLOUD_RECIPE_LOOKUP'}, `More than one Genymotion-Cloud recipe found for recipe name ${recipeName}`);
    }
    return new Recipe(recipes[0]);
  }

  async getRecipeByUUID(uuid) {
    return new Recipe({
      uuid,
      name: `Recipe of ${uuid}`,
    });
  }
}

module.exports = GenyRecipesService;
