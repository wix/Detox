const Recipe = require('./GenyRecipe');

const STATE_ONLINE = 'ONLINE';
const STATE_CREATING = 'CREATING';
const STATE_BOOTING = 'BOOTING';
const STATE_STARTING = 'STARTING';
const initStates = new Set([
  STATE_CREATING,
  STATE_BOOTING,
  STATE_STARTING,
]);

const data = Symbol('data');
const recipe = Symbol('recipe');

class GenyInstance {
  constructor(rawInstance) {
    this[data] = rawInstance;
    this[recipe] = new Recipe(rawInstance.recipe);
  }

  get uuid() {
    return this[data].uuid;
  }

  get name() {
    return this[data].name;
  }

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
  get state() {
    return this[data].state;
  }

  get adbName() {
    return this[data].adb_serial;
  }

  get recipeName() {
    return this[recipe].name;
  }

  get recipeUUID() {
    return this[recipe].uuid;
  }

  isAdbConnected() {
    return this.adbName !== '0.0.0.0';
  }

  isOnline() {
    return this.state === STATE_ONLINE;
  }

  isInitializing() {
    return initStates.has(this.state);
  }

  toString() {
    const description = [
      this.uuid,
      this.adbName
    ].filter(Boolean).join('/');

    return `${this.name} (${description})`;
  }

  toJSON() {
    return this[data];
  }
}

module.exports = GenyInstance;
