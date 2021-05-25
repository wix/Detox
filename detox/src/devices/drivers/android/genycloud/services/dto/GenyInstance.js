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
    this.uuid = rawInstance.uuid;
    this.name = rawInstance.name;

    /**
     * According to Genymotion's API docs, state is an enum with these possible values (description is not official):
     * - "CREATING": Handling instance creation request
     * - "STARTING": Instance created but not yet available for usage
     * - "BOOTING": Instance created & started; Android OS is not booting
     * - "ONLINE": Instance is ready for action
     * - "RECYCLED": Instance has been automatically shut down due an idle timeout
     * - "STOPPING": Instance is being shut-down
     *
     * Additional states: "OFFLINE", "SAVING", "SAVED", "DELETING", "ERROR", "REVOKED", "EXPIRED".
     */
    this.state = rawInstance.state;
    this.adb = {
      name: rawInstance.adb_serial,
      port: rawInstance.adb_serial_port,
    };
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

  toString() {
    return `GenyCloud:${this.name} (${this.uuid} ${this.adbName})`;
  }
}

module.exports = GenyInstance;
