const { DetoxCircusEnvironment } = require('detox/runners/jest');
const { device } = require('detox');
const detoxInternals = require('detox/internals');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context);

    this.initTimeout = 15000;
  }

  /** @override */
  async initDetox() {
    await super.initDetox();

    console.log('Making problems with client');

    const client = detoxInternals.worker._client;
    client._slowInvocationTimeout = 0;

    const aws = client._asyncWebSocket;
    const awsSend = aws.send.bind(aws);
    aws.send = (message, opts) => {
      const promise = awsSend(message, opts);
      if (message.type === 'isReady') {
        aws.inFlightPromises[message.messageId] = { resolve() {}, reject() {}, promise: new Promise(() => {}) };
      }
      return promise;
    };

    await device.selectApp('example');
    await device.launchApp();
  }
}

module.exports = CustomDetoxEnvironment;
