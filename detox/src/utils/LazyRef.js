class LazyRef {
  constructor(genFunc) {
    this._genFunc = genFunc;
    this._ref = null;
  }

  get ref() {
    if (!this._ref) {
      this._ref = this._genFunc();
      this._genFunc = undefined;
    }
    return this._ref;
  }
}

module.exports = LazyRef;
