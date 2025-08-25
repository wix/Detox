describe('Genymotion-Cloud recipes service', () => {
  const givenNoRecipes = () => {
    exec.getRecipe.mockResolvedValue({
      recipes: [],
    });
  };

  const givenRecipes = (...recipes) => {
    exec.getRecipe.mockResolvedValue({
      recipes: [...recipes],
    });
  };

  const aRecipe = () => ({
    uuid: 'mock-recipe-uuid',
    name: 'mock-recipe-name',
  });

  const anotherRecipe = () => ({
    uuid: 'another-mock-recipe-uuid',
    name: 'another-mock-recipe-name',
  });

  let exec;
  let uut;
  beforeEach(() => {
    const GenyCloudExec = jest.createMockFromModule('../exec/GenyCloudExec');
    exec = new GenyCloudExec();

    const GenyRecipesService = require('./GenyRecipesService');
    uut = new GenyRecipesService(exec);
  });

  describe('getting a recipe by name', () => {
    it('should throw an error if no recipes found', async () => {
      givenNoRecipes();
      await expect(uut.getRecipeByName('mock-name')).rejects.toThrowErrorMatchingSnapshot();
    });

    it('should return the recipe if exactly one match is found', async () => {
      const recipe = aRecipe();
      givenRecipes(recipe);

      const result = await uut.getRecipeByName(recipe.name);

      expect(result.uuid).toEqual(recipe.uuid);
    });

    it('should return a recipe DTO', async () => {
      const recipe = aRecipe();
      givenRecipes(recipe);

      const result = await uut.getRecipeByName(recipe.name);
      expect(result.constructor.name).toContain('Recipe');
    });

    it('should throw an error if there are multiple matches', async () => {
      const recipe = aRecipe();
      const recipe2 = anotherRecipe();
      givenRecipes(recipe, recipe2);

      await expect(uut.getRecipeByName(recipe.name)).rejects.toThrowErrorMatchingSnapshot();
    });
  });

  describe('Getting a recipe by UUID', () => {
    it('should immediately return a recipe', async () => {
      const recipe = aRecipe();

      const result = await uut.getRecipeByUUID(recipe.uuid);

      expect(result.uuid).toEqual(recipe.uuid);
      expect(result.constructor.name).toContain('Recipe');
    });
  });
});
