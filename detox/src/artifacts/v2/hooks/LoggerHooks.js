class LoggerHooks {
  constructor({
    pathStrategy
  }) {
    this._pathStrategy = pathStrategy;
  }

  onStart() {

  }

  onBeforeTest(testSummary) {

  }

  onAfterTest(summary) {

  }

  onExit() {

  }
}

module.exports = LoggerHooks;