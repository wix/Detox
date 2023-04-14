class WebInteraction {
  constructor(invocationManager) {
    this._call = undefined;
    this._invocationManager = invocationManager;
  }

  async execute() {
    const resultObj = await this._invocationManager.execute(this._call);
    return resultObj ? resultObj.result : undefined;
  }
}

class ActionInteraction extends WebInteraction {
  constructor(invocationManager, action) {
    super(invocationManager);
    this._call = action._call;
  }
}

class WebAssertionInteraction extends WebInteraction {
  constructor(invocationManager, assertion) {
    super(invocationManager);
    this._call = assertion._call;
  }
}

module.exports = {
  WebInteraction,
  ActionInteraction,
  WebAssertionInteraction,
};
