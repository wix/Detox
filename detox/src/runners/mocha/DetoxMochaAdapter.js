class DetoxMochaAdapter {
  constructor(detox) {
    this.detox = detox;
  }

  async beforeEach(context) {
    await this.detox.beforeEach(Object.freeze({
      title: context.currentTest.title,
      fullName: context.currentTest.fullTitle(),
      status: this._mapStatus(context),
    }));
  }

  async afterEach(context) {
    await this.detox.afterEach(Object.freeze({
      title: context.currentTest.title,
      fullName: context.currentTest.fullTitle(),
      status: this._mapStatus(context),
    }));
  }

  _mapStatus(context) {
    switch (context.currentTest.state) {
      case 'passed': return 'passed';
      case 'failed': return 'failed';
      default: return 'running';
    }
  }
}

module.exports = DetoxMochaAdapter;