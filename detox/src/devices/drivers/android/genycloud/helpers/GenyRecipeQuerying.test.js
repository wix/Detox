describe('Genymotion-cloud recipe-query helper', () => {

  let recipesService;
  let uut;
  beforeEach(() => {
    const RecipesService = jest.genMockFromModule('../services/GenyRecipesService');
    recipesService = new RecipesService();

    const DeviceQueryHelper = require('./GenyRecipeQuerying');
    uut = new DeviceQueryHelper(recipesService);
  });

  const aRecipe = () => ({
    uuid: 'mock-recipe-uuid',
    name: 'mock-recipe-name',
  });
  const anotherRecipe = () => ({
    uuid: 'mock-recipe-uuid2',
    name: 'mock-recipe-name2',
  });

  const givenRecipeByNameResult = (recipe) => recipesService.getRecipeByName.mockResolvedValue(recipe);
  const givenRecipeByUUIDResult = (recipe) => recipesService.getRecipeByUUID.mockResolvedValue(recipe);

  it('should query based on an object containing recipe name', async () => {
    const deviceQuery = {
      recipeName: 'recipe-mock-name',
    };
    const recipe = aRecipe();
    givenRecipeByNameResult(recipe);

    const result = await uut.getRecipeFromQuery(deviceQuery);
    expect(result).toEqual(recipe);
    expect(recipesService.getRecipeByName).toHaveBeenCalledWith(deviceQuery.recipeName);
  });

  it('should query based on an object containing recipe UUID', async () => {
    const deviceQuery = {
      recipeUUID: 'recipe-mock-name',
    };
    const recipe1 = aRecipe();
    const recipe2 = anotherRecipe();
    givenRecipeByNameResult(recipe1);
    givenRecipeByUUIDResult(recipe2);

    const result = await uut.getRecipeFromQuery(deviceQuery);
    expect(result).toEqual(recipe2);
    expect(recipesService.getRecipeByUUID).toHaveBeenCalledWith(deviceQuery.recipeUUID);
    expect(recipesService.getRecipeByName).not.toHaveBeenCalledWith();
  });
});
