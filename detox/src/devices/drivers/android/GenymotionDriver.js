const AndroidDriver = require('./AndroidDriver');
const environment = require('../../../utils/environment');
const cp = require('child_process');
const _ = require('lodash');
const {default: ADB} = require('./exec/ADB');

let instanceCounter = 0

const DEFAULT_RECIPE_NAME = "Google Pixel 3a"

class GenymotionDriver extends AndroidDriver {
  constructor(config) {
    super(config);

    this._name = 'Unspecified Genymotion Cloud Emulator';
    // This is OK since the function has no arguments (lodash memoize cache size is ∞)
    this.getRecipes = _.memoize(this._getRecipesRaw);

  }

  get name() {
    return this._name
  }

  _getRecipesRaw() {
    const rawResult = JSON.parse(cp.execSync('gmsaas --format json recipes list').toString());
    const {recipes} = rawResult;
    return recipes
  }

  async acquireFreeDevice(deviceQuery) {
    const {recipeName} = deviceQuery;
    let recipe;
    let recipes = await this.getRecipes();
    recipe = recipes.find(recipe => recipe.name === recipeName)
    if (!recipe) {
      console.warn(`Couldn't find desired emulator, resorting to ${DEFAULT_RECIPE_NAME}`)
      recipe = recipes.find(recipe => recipe.name === DEFAULT_RECIPE_NAME);
    } else {
      console.log(`Found recipe ${recipeName}`)
    }

    const adbSerial = await this.deviceRegistry.allocateDevice(() => this._boot(recipe));

    this.adbSerial = adbSerial;
    await this.adb.apiLevel(this.adbSerial);
    await this.adb.disableAndroidAnimations(this.adbSerial);
    await this.adb.unlockScreen(this.adbSerial);

    this._name = `${recipe.name} - ${this.adbSerial}`;
    return adbSerial;
  }

  async _getFreeInstances(recipeName) {
    const searchResults = await this._getInstancesByRecipeName(recipeName);

    return searchResults.filter(instance => !this.deviceRegistry.isDeviceBusy(instance.uuid));
  }

  _getInstancesByRecipeName(recipeName) {
    const recipes = this.getRecipes();
    const matchingRecipes = recipes.filter(recipe => recipe.name === recipeName);
    const instances = JSON.parse(cp.execSync('gmsaas --format json instances list').toString()).instances;
    return instances.filter(instance => matchingRecipes.some(recipe => recipe.uuid === instance.recipe.uuid));
  }

  async _boot(recipe) {
    let adbSerial;
    const freeInstances = await this._getFreeInstances(recipe.name);
    if (!_.isEmpty(freeInstances)) {
      adbSerial = freeInstances[0].adb_serial;
      await this.emitter.emit('bootDevice', { coldBoot: false, deviceId: adbSerial, type: recipe.name});
      return adbSerial;
    }
    const instanceName = `instance-${++instanceCounter}`;
    const instanceUUID = cp.execSync(`gmsaas instances start ${recipe.uuid} ${instanceName}`).toString().trim();
    adbSerial = JSON.parse(cp.execSync(`gmsaas --format json instances adbconnect ${instanceUUID}`).toString()).instance.adb_serial;

    await this.emitter.emit('bootDevice', { coldBoot: true, deviceId: adbSerial, type: recipe.name});

    return adbSerial;
  }

  async shutdown(deviceId) {
    await this.emitter.emit('beforeShutdownDevice', { deviceId });
    cp.execSync(`gmsaas instances stop ${deviceId}`);
    await this.emitter.emit('shutdownDevice', { deviceId });
  }
}


module.exports = GenymotionDriver;
