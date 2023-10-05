class FakeDetoxWorker {
  static mock = {
    instances: [],
  };

  constructor() {
    this.init = jest.fn();
    this.cleanup = jest.fn();

    // Jest-mimicking hack
    FakeDetoxWorker.mock.instances.push(this);
  }
}

module.exports = FakeDetoxWorker;
