const { DetoxRuntimeError } = require('../../../../../../errors');

const Recipe = require('./dto/GenyRecipe');

class GenyRecipesService {
  constructor(genyCloudExec) {
    this.genyCloudExec = genyCloudExec;
  }

  async getRecipeByName(recipeName) {
    const { recipes } = await this.genyCloudExec.getRecipe(recipeName);
    if (!recipes.length) {
      throw new DetoxRuntimeError({
        message: `No Genymotion-Cloud recipe found for recipe name "${recipeName}"`,
        hint: `Please check your recipe name or use recipe UUID instead.`,
      });
    }

    if (recipes.length > 1) {
      const recipesInfoList = recipes.map((recipe) => `  ${recipe.name} (${recipe.uuid})`).join('\n');
      throw new DetoxRuntimeError({
        message: `More than one Genymotion-Cloud recipe found for recipe name ${recipeName}:\n${recipesInfoList}`,
        hint: `Please specify a unique recipe name or use recipe UUID instead.`,
      });
    }
    return new Recipe(recipes[0]);
  }

  async getRecipeByUUID(uuid) {
    return new Recipe({ uuid });
  }
}

module.exports = GenyRecipesService;
