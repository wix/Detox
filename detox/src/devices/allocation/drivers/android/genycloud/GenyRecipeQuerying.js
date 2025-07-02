class GenyRecipeQuerying {
  /**
   * @param {import('./services/GenyRecipesService')} recipesService
   */
  constructor(recipesService) {
    this.recipesService = recipesService;
  }

  async getRecipeFromQuery({ recipeName, recipeUUID }) {
    return recipeUUID
      ? this.recipesService.getRecipeByUUID(recipeUUID)
      : this.recipesService.getRecipeByName(recipeName);
  }
}

module.exports = GenyRecipeQuerying;
