const detox = require('detox');
class DetoxCucumberAdapter {
  constructor(detox) {
  this.detox = detox;
  }

  async beforeEach(context) {
    await this.detox.beforeEach({
      title: context.pickle.name,
      fullName: context.pickle.name,
      status: 'running',
    });
  }

  async afterEach(context) {
    await this.detox.afterEach({
      title: context.pickle.name,
      fullName: context.pickle.name,
      status: this._mapStatus(context, true),
      timedOut: context.result.duration,
    });
  }

  _mapStatus(context) {
    switch (context.result.status) {
      case 'passed':
        return 'passed';
      case 'failed':
        return 'failed';
      default:
        return 'failed';
    }
  }
}

module.exports = new DetoxCucumberAdapter(detox);