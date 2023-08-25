const { DetoxInternalError } = require('../../../../../errors');

class GenyRegistry {
  constructor() {
    /** @type {Map<string, import('./services/dto/GenyRecipe')>} */
    this._recipes = new Map();
    /** @type {Map<string, import('./services/dto/GenyInstance')>} */
    this._freeInstances = new Map();
    /** @type {Map<string, import('./services/dto/GenyInstance')>} */
    this._busyInstances = new Map();
    /** @type {Set<string>} */
    this._newInstances = new Set();
  }

  getInstances() {
    return [...this._freeInstances.values(), ...this._busyInstances.values()];
  }

  /**
   * @param {import('./services/dto/GenyInstance')} instance
   * @param {import('./services/dto/GenyRecipe')} recipe
   */
  addInstance(instance, recipe) {
    this._recipes.set(instance.uuid, recipe);
    this._busyInstances.set(instance.uuid, instance);
    this._newInstances.add(instance.uuid);
  }

  /** @param {import('./services/dto/GenyInstance')} instance */
  pollNewInstance(instance) {
    const result = this._newInstances.has(instance.uuid);
    this._newInstances.delete(instance.uuid);
    return result;
  }

  /** @param {import('./services/dto/GenyInstance')} instance */
  updateInstance(instance) {
    if (this._freeInstances.has(instance.uuid)) {
      this._freeInstances.set(instance.uuid, instance);
    }

    if (this._busyInstances.has(instance.uuid)) {
       this._busyInstances.set(instance.uuid, instance);
    }
  }

  /** @param {import('./services/dto/GenyInstance')} instance */
  removeInstance(instance) {
    this._freeInstances.delete(instance.uuid);
    this._busyInstances.delete(instance.uuid);
    this._newInstances.delete(instance.uuid);
    this._recipes.delete(instance.uuid);
  }

  /** @param {import('./services/dto/GenyInstance')} instance */
  markAsBusy(instance) {
    if (!this._recipes.has(instance.uuid)) {
      throw new DetoxInternalError(`Cannot mark an unknown instance ${instance.uuid} as busy`);
    }

    this._busyInstances.set(instance.uuid, instance);
    this._freeInstances.delete(instance.uuid);
    return instance;
  }

  /** @param {import('./services/dto/GenyInstance')} instance */
  markAsFree(instance) {
    if (!this._busyInstances.has(instance.uuid)) {
      throw new DetoxInternalError(`Cannot mark an unknown instance ${instance.uuid} as free`);
    }

    this._freeInstances.set(instance.uuid, instance);
    this._busyInstances.delete(instance.uuid);
    return instance;
  }

  findFreeInstance(recipe) {
    for (const instance of this._freeInstances.values()) {
      const aRecipe = this._recipes.get(instance.uuid);
      if (recipe.uuid === aRecipe.uuid) {
        return this.markAsBusy(instance);
      }
    }
  }
}

module.exports = GenyRegistry;
