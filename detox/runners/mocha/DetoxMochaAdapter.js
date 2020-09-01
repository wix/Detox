class DetoxMochaAdapter {
  constructor(detox) {
    this.detox = detox;
    this._invocations = 1 + Number(process.env.DETOX_RERUN_INDEX || '0');
  }

  async beforeEach(context) {
    await this.detox.beforeEach({
      title: context.currentTest.title,
      fullName: context.currentTest.fullTitle(),
      status: this._mapStatus(context, false),
      invocations: this._invocations,
    });
  }

  async afterEach(context) {
    await this.detox.afterEach({
      title: context.currentTest.title,
      fullName: context.currentTest.fullTitle(),
      status: this._mapStatus(context, true),
      invocations: this._invocations,
      timedOut: context.currentTest.timedOut,
    });
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
