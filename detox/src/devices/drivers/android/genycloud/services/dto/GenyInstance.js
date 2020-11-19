const _ = require('lodash');
const Recipe = require('./GenyRecipe');

const STATE_ONLINE = 'ONLINE';
const STATE_CREATING = 'CREATING';
const STATE_BOOTING = 'BOOTING';
const STATE_STARTING = 'STARTING';
const initStates = [
  STATE_CREATING,
  STATE_BOOTING,
  STATE_STARTING,
];

class GenyInstance {
  constructor(rawInstance) {
    Object.assign(this, _.pick(rawInstance, 'uuid', 'name', 'state'));
    this.adb = {
      name: rawInstance.adb_serial,
      port: rawInstance.adb_serial_port,
    }
    this.recipe = new Recipe(rawInstance.recipe);
  }

  isAdbConnected() {
    return this.adb.name !== '0.0.0.0';
  }

  isOnline() {
    return this.state === STATE_ONLINE;
  }

  isInitializing() {
    return initStates.includes(this.state);
  }

  get recipeName() {
    return this.recipe.name;
  }

  get recipeUUID() {
    return this.recipe.uuid;
  }

  get adbName() {
    return this.adb.name;
  }
}

module.exports = GenyInstance;
