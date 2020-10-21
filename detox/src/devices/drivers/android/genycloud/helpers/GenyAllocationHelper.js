class GenyAllocationHelper {
  constructor(instanceLookupService, instanceLifecycleService) {
    this.instanceLookupService = instanceLookupService;
    this.instanceLifecycleService = instanceLifecycleService;
    this.coldBooted = undefined;
  }

  async allocateInstance(recipeUUID) {
    let coldBooted = false;

    let instance = await this.instanceLookupService.findFreeInstance(recipeUUID);
    if (!instance) {
      instance = await this.instanceLifecycleService.createInstance(recipeUUID);
      coldBooted = true;
    }

    if (!instance.isAdbConnected()) {
      instance = await this.instanceLifecycleService.adbConnectInstance(instance.uuid);
    }

    return {
      instance,
      coldBooted,
    };
  }
}

module.exports = GenyAllocationHelper;
