class GenyAuthService {
  constructor(genyCloudExec) {
    this.genyCloudExec = genyCloudExec;
  }

  async getLoginEmail() {
    const whoAmI = await this.genyCloudExec.whoAmI();
    return whoAmI.auth.email;
  }
}

module.exports = GenyAuthService;
