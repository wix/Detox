class DetoxMochaAdapter {
  constructor(detox) {
    this.detox = detox;
  }

  async beforeEach(context) {
    await this.detox.beforeEach(Object.freeze({
      title: context.currentTest.title,
      fullName: context.currentTest.fullTitle(),
      status: this._mapStatus(context, false),
    }));
  }

  async afterEach(context) {
    await this.detox.afterEach(Object.freeze({
      title: context.currentTest.title,
      fullName: context.currentTest.fullTitle(),
      status: this._mapStatus(context, true),
    }));
  }

  _mapStatus(context, isAfterTest) {
    switch (context.currentTest.state) {
      case 'passed':
        return 'passed';
      case 'failed':
        return 'failed';
      default:
        return isAfterTest ? 'failed' : 'running';
    }
  }
}

module.exports = DetoxMochaAdapter;