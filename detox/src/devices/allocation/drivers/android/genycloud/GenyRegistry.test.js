const GenyRegistry = require('./GenyRegistry');
const GenyInstance = require('./services/dto/GenyInstance');

const sampleRecipe = { uuid: 'sample-recipe-uuid' };

const sampleInstance = new GenyInstance({
  uuid: 'sample-instance-uuid',
  name: 'sample-instance-name',
  state: 'CREATING',
  recipe: sampleRecipe,
});

describe('GenyRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new GenyRegistry();
  });

  it('should be empty when created', () => {
    expect(registry.getInstances()).toEqual([]);
  });

  describe('when added an instance', () => {
    beforeEach(() => registry.addInstance(sampleInstance, sampleRecipe));

    it('should be able to return that instance among all instances', () => {
      expect(registry.getInstances()).toEqual([sampleInstance]);
    });

    it('should mark it as new', () => {
      expect(registry.pollNewInstance(sampleInstance.uuid)).toBe(true);

      // The pollNewInstance() method should reset the new instance flag
      expect(registry.pollNewInstance(sampleInstance.uuid)).toBe(false);
    });

    it('should automatically mark it as busy', () => {
      expect(registry.findFreeInstance(sampleRecipe)).toBeUndefined();
    });

    describe.each([
      ['busy state', true],
      ['free state', false],
    ])('when updated that instance in %s', (_label, isBusy) => {
      let updatedInstance;

      beforeEach(() => isBusy
        ? registry.markAsBusy(sampleInstance.uuid)
        : registry.markAsFree(sampleInstance.uuid));

      beforeEach(() => {
        updatedInstance = new GenyInstance(sampleInstance);
        registry.updateInstance(updatedInstance);
      });

      it('should return the updated instance', () => {
        const instances = registry.getInstances();
        expect(instances).toHaveLength(1);
        expect(instances[0]).toBe(updatedInstance);
      });
    });

    describe('and removed that instance', () => {
      beforeEach(() => registry.removeInstance(sampleInstance.uuid));

      it('should be empty again', () => {
        expect(registry.getInstances()).toEqual([]);
      });

      it('should fail to update that instance', () => {
        expect(() => registry.updateInstance(sampleInstance)).toThrow(/unknown instance/);
      });
    });

    describe('and marked it as free', () => {
      beforeEach(() => registry.markAsFree(sampleInstance.uuid));

      it('should return it as free', () => {
        expect(registry.findFreeInstance(sampleRecipe)).toBe(sampleInstance);
      });

      it('should not confuse it with another recipe', () => {
        expect(registry.findFreeInstance({ uuid: 'another-recipe-uuid' })).toBeUndefined();
      });

      it('should return that instance again and again when marking it as free', () => {
        expect(registry.markAsFree(sampleInstance.uuid)).toBe(sampleInstance);
      });

      describe('and then marked it as busy', () => {
        beforeEach(() => registry.markAsBusy(sampleInstance.uuid));

        it('should return it as busy', () => {
          expect(registry.findFreeInstance(sampleRecipe)).toBeUndefined();
        });

        it('should return that instance again and again when marking it as busy', () => {
          expect(registry.markAsBusy(sampleInstance.uuid)).toBe(sampleInstance);
        });
      });
    });
  });

  describe('when marking an unknown instance', () => {
    it('should fail to mark it as free', () => {
      expect(() => registry.markAsFree(sampleInstance.uuid)).toThrow(/unknown instance/);
    });

    it('should fail to mark it as busy', () => {
      expect(() => registry.markAsBusy(sampleInstance.uuid)).toThrow(/unknown instance/);
    });
  });
});
