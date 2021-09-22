class GenyRecipeQuerying {
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
