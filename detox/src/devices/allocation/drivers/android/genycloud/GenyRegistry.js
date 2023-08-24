class GenyRegistry {
  constructor() {
    /** @type {Map<import('./services/dto/GenyInstance'), import('./services/dto/GenyRecipe')>} */
    this._availableInstances = new Map();
    /** @type {Set<import('./services/dto/GenyInstance')>} */
    this._busyInstances = new Set();
  }

  getInstances() {
    return [...this._availableInstances.keys()];
  }

  isBusy(instance, strict = false) {
    return strict
      ? this._busyInstances.has(instance)
      : this.isBusy(this.findInstance(instance), true);
  }

  addInstance(instance, recipe) {
    this._availableInstances.set(instance, recipe);
    this._busyInstances.add(instance);
  }

  updateInstance(oldInstance, newInstance) {
    if (oldInstance !== newInstance) {
      if (this._availableInstances.has(oldInstance)) {
        this._availableInstances.set(newInstance, this._availableInstances.get(oldInstance));
        this._availableInstances.delete(oldInstance);
      }

      if (this._busyInstances.delete(oldInstance)) {
        this._busyInstances.add(newInstance);
      }
    }

    return newInstance;
  }

  removeInstance(instance, strict = false) {
    if (strict) {
      this._availableInstances.delete(instance);
      this._busyInstances.delete(instance);
    } else {
      const anInstance = this.findInstance(instance);
      this.removeInstance(anInstance, true);
    }
  }

  busyInstance(instance, strict = false) {
    if (strict) {
      this._busyInstances.add(instance);
    } else {
      const anInstance = this.findInstance(instance);
      this.busyInstance(anInstance, true);
    }
  }

  freeInstance(instance, strict = false) {
    if (strict) {
      this._busyInstances.delete(instance);
    } else {
      const anInstance = this.findInstance(instance);
      this.freeInstance(anInstance, true);
    }
  }

  findInstance(instance) {
    for (const anInstance of this._availableInstances.keys()) {
      if (anInstance.uuid === instance.uuid) {
        return anInstance;
      }
    }
  }

  getFreeInstance(recipe) {
    for (const [anInstance, aRecipe] of this._availableInstances) {
      if (recipe.uuid === aRecipe.uuid && !this._busyInstances.has(anInstance)) {
        this._busyInstances.add(anInstance);
        return anInstance;
      }
    }
  }
}

module.exports = GenyRegistry;
