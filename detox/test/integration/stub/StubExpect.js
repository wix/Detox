const temporaryPath = require('detox/src/artifacts/utils/temporaryPath');
const sleep = require('detox/src/utils/sleep');

class StubMatcher {
  constructor() {
    [
      'withAncestor',
      'withDescendant',
      'and',
      'or',
    ].forEach((method) => {
      this[method] = () => this;
    });
    this.not = this;
  }
}

class StubInteraction {
  constructor({ delay = 10 } = {}) {
    this._delay = delay;
  }

  async execute() {
    await sleep(this._delay);
  }
}

class StubActionInteraction extends StubInteraction {
  constructor() {
    super({ delay: 100 });
  }
}

class StubMatcherAssertionInteraction extends StubInteraction {
}

class StubWaitForInteraction extends StubInteraction {
  constructor() {
    super({ delay: 100 });
    this.withTimeout = () => this.execute();
    this.whileElement = () => ({
      scroll: () => this.execute(),
    });
  }
}

class StubElement {
  constructor() {
    const stubInteraction = new StubActionInteraction();
    const interactionExecFn = () => stubInteraction.execute();

    [
      'tap',
      'tapAtPoint',
      'longPress',
      'multiTap',
      'tapBackspaceKey',
      'tapReturnKey',
      'typeText',
      'replaceText',
      'clearText',
      'scroll',
      'scrollTo',
      'swipe',
    ].forEach((method) => {
        this[method] = interactionExecFn;
    });
    this.atIndex = () => this;
    this.takeScreenshot = () => Promise.resolve(temporaryPath.for.png());
  }
}

class StubElementExpect {
  constructor() {
    const stubInteraction = new StubMatcherAssertionInteraction();
    const interactionExecFn = () => stubInteraction.execute();

    [
      'toBeNotVisible',
      'toBeVisible',
      'toExist',
      'toHaveId',
      'toHaveLabel',
      'toHaveText',
      'toHaveToggleValue',
      'toHaveValue',
      'toNotExist',
      'toNotHaveId',
      'toNotHaveLabel',
      'toNotHaveText',
      'toNotHaveValue',
    ].forEach((method) => {
      this[method] = interactionExecFn;
    });
    this.not = this;
  }
}

class StubWaitForElement {
  constructor() {
    const stubInteraction = new StubWaitForInteraction();
    const interactionExecFn = () => stubInteraction.execute();

    [
      'toBeNotVisible',
      'toBeVisible',
      'toExist',
      'toHaveId',
      'toHaveLabel',
      'toHaveText',
      'toHaveValue',
      'toNotExist',
      'toNotHaveId',
      'toNotHaveLabel',
      'toNotHaveText',
      'toNotHaveValue',
    ].forEach((method) => {
      this[method] = interactionExecFn;
    });
    this.not = this;
  }
}

class StubExpect {
  constructor() {
    const stubMatcher = new StubMatcher();
    this.by = {
      accessibilityLabel: () => stubMatcher,
      label: () => stubMatcher,
      id: () => stubMatcher,
      type: () => stubMatcher,
      traits: () => stubMatcher,
      value: () => stubMatcher,
      text: () => stubMatcher,
    };

    this.element = () => new StubElement();
    this.expect = () => new StubElementExpect();
    this.waitFor = () => new StubWaitForElement();
  }
}

module.exports = StubExpect;
