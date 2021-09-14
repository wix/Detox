const logger = require('../../../../../../utils/logger').child({ __filename });

  const Recipe = require('./dto/GenyRecipe');

class GenyRecipesService {
  constructor(genyCloudExec) {
    this.genyCloudExec = genyCloudExec;
  }

  async getRecipeByName(recipeName) {
    const { recipes } = await this.genyCloudExec.getRecipe(recipeName);
    if (!recipes.length) {
      return null;
    }

    if (recipes.length > 1) {
      const recipesInfoList = recipes.map((recipe) => `  ${recipe.name} (${recipe.uuid})`).join('\n');
      logger.warn(
        { event: 'GENYCLOUD_RECIPE_LOOKUP' },
        `More than one Genymotion-Cloud recipe found for recipe name ${recipeName}:\n${recipesInfoList}\nFalling back to ${recipes[0].name}`
      );
    }
    return new Recipe(recipes[0]);
  }

  async getRecipeByUUID(uuid) {
    return new Recipe({ uuid });
  }
}

module.exports = GenyRecipesService;
