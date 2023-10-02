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

  /**
   * @returns {import('./services/dto/GenyInstance')[]}
   */
  getInstances() {
    return [
      ...this._freeInstances.values(),
      ...this._busyInstances.values(),
    ];
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

  /**
   * @param {string} instanceId
   * @returns {boolean}
   */
  pollNewInstance(instanceId) {
    const result = this._newInstances.has(instanceId);
    this._newInstances.delete(instanceId);
    return result;
  }

  /** @param {import('./services/dto/GenyInstance')} instance */
  updateInstance(instance) {
    let found = false;

    if (this._freeInstances.has(instance.uuid)) {
      this._freeInstances.set(instance.uuid, instance);
      found = true;
    }

    if (this._busyInstances.has(instance.uuid)) {
       this._busyInstances.set(instance.uuid, instance);
       found = true;
    }

    if (!found) {
      throw new DetoxInternalError(`Cannot update an unknown instance ${instance.uuid}`);
    }
  }

  /** @param {string} instanceId */
  removeInstance(instanceId) {
    this._freeInstances.delete(instanceId);
    this._busyInstances.delete(instanceId);
    this._newInstances.delete(instanceId);
    this._recipes.delete(instanceId);
  }

  /**
   * @param {string} instanceId
   * @returns {import('./services/dto/GenyInstance')}
   */
  markAsBusy(instanceId) {
    if (this._busyInstances.has(instanceId)) {
      return this._busyInstances.get(instanceId);
    }

    const instance = this._freeInstances.get(instanceId);
    if (!instance) {
      throw new DetoxInternalError(`Cannot mark an unknown instance ${instanceId} as busy`);
    }

    this._busyInstances.set(instanceId, instance);
    this._freeInstances.delete(instanceId);
    return instance;
  }

  /**
   * @param {string} instanceId
   * @returns {import('./services/dto/GenyInstance')}
   */
  markAsFree(instanceId) {
    if (this._freeInstances.has(instanceId)) {
      return this._freeInstances.get(instanceId);
    }

    const instance = this._busyInstances.get(instanceId);
    if (!instance) {
      throw new DetoxInternalError(`Cannot mark an unknown instance ${instanceId} as free`);
    }

    this._busyInstances.delete(instanceId);
    this._freeInstances.set(instanceId, instance);
    return instance;
  }

  /** @returns {import('./services/dto/GenyInstance') | undefined} */
  findFreeInstance(recipe) {
    for (const instance of this._freeInstances.values()) {
      const aRecipe = this._recipes.get(instance.uuid);
      if (recipe.uuid === aRecipe.uuid) {
        return this.markAsBusy(instance.uuid);
      }
    }
  }
}

module.exports = GenyRegistry;
