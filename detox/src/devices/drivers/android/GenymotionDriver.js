const AndroidDriver = require('./AndroidDriver');
const environment = require('../../../utils/environment');
const cp = require('child_process');

let instanceCounter = 0

const DEFAULT_RECIPE_NAME = "Google Pixel 3a"

class GenymotionDriver extends AndroidDriver {
  constructor(config) {
    super(config);

    this._name = 'Unspecified Genymotion Cloud Emulator';
  }

  get name() {
    return this._name
  }

  async acquireFreeDevice(deviceQuery) {
    const rawResult = JSON.parse(cp.execSync('gmsaas --format json recipes list').toString());
    const {recipes} = rawResult
    let recipe;
    let selectedRecipeName = deviceQuery;
    recipe = recipes.find(recipe => recipe.name === deviceQuery)
    if (!recipe) {
      console.warn(`Couldn't find desired emulator, resorting to ${DEFAULT_RECIPE_NAME}`)
      recipe = recipes.find(recipe => recipe.name === DEFAULT_RECIPE_NAME);
      selectedRecipeName = DEFAULT_RECIPE_NAME;
    }

    const adbSerial = await this._boot(recipe.uuid, recipe.name);

    this.adbSerial = adbSerial;
    await this.adb.apiLevel(this.adbSerial);
    await this.adb.disableAndroidAnimations(this.adbSerial);
    await this.adb.unlockScreen(this.adbSerial);

    this._name = `${selectedRecipeName} - ${this.adbSerial}`;
    return adbSerial;
  }

  async _boot(recipeUUID, recipeName) {
    const name = `instance-${++instanceCounter}`;
    const instanceUUID = cp.execSync(`gmsaas instances start ${recipeUUID} ${name}`).toString().trim();
    const adbSerial = JSON.parse(cp.execSync(`gmsaas --format json instances adbconnect ${instanceUUID}`).toString()).instance.adb_serial;

    await this.emitter.emit('bootDevice', { coldBoot: true, deviceId: adbSerial, type: recipeName});

    return adbSerial;
  }

  async shutdown(deviceId) {
    await this.emitter.emit('beforeShutdownDevice', { deviceId });
    cp.execSync(`gmsaas instances stop ${deviceId}`);
    await this.emitter.emit('shutdownDevice', { deviceId });
  }
}


module.exports = GenymotionDriver;
