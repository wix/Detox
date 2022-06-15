const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const { ScrollAmountStopAtEdgeAction } = require('../actions/native');
const { NativeMatcher } = require('../core/NativeMatcher');
const DetoxAssertionApi = require('../espressoapi/DetoxAssertion');
const EspressoDetoxApi = require('../espressoapi/EspressoDetox');

function call(maybeAFunction) {
  return maybeAFunction instanceof Function ? maybeAFunction() : maybeAFunction;
}

class Interaction {
  /**
   * @param device { RuntimeDevice }
   */
  constructor(device) {
    this._call = undefined;
    this._device = device;
  }

  async execute() {
    const resultObj = await this._device.selectedApp.invoke(this._call);
    return resultObj ? resultObj.result : undefined;
  }
}

class ActionInteraction extends Interaction {
  constructor(device, element, action) {
    super(device);
    this._call = EspressoDetoxApi.perform(call(element._call), action._call);
    // TODO: move this.execute() here from the caller
  }
}

class MatcherAssertionInteraction extends Interaction {
  constructor(device, element, matcher) {
    super(device);
    this._call = DetoxAssertionApi.assertMatcher(call(element._call), matcher._call.value);
    // TODO: move this.execute() here from the caller
  }
}

class WaitForInteraction extends Interaction {
  constructor(device, element, assertionMatcher) {
    super(device);
    this._element = element;
    this._assertionMatcher = assertionMatcher;
    this._element._selectElementWithMatcher(this._element._originalMatcher);
  }

  async withTimeout(timeout) {
    if (typeof timeout !== 'number') throw new DetoxRuntimeError(`WaitForInteraction withTimeout argument must be a number, got ${typeof timeout}`);
    if (timeout < 0) throw new DetoxRuntimeError('timeout must be larger than 0');

    this._call = DetoxAssertionApi.waitForAssertMatcher(call(this._element._call), this._assertionMatcher._call.value, timeout / 1000);
    await this.execute();
  }

  whileElement(searchMatcher) {
    return new WaitForActionInteraction(this._device, this._element, this._assertionMatcher, searchMatcher);
  }
}

class WaitForActionInteractionBase extends Interaction {
  constructor(device, element, matcher, searchMatcher) {
    super(device);
    //if (!(element instanceof NativeElement)) throw new DetoxRuntimeError(`WaitForActionInteraction ctor 1st argument must be a valid NativeElement, got ${typeof element}`);
    //if (!(matcher instanceof NativeMatcher)) throw new DetoxRuntimeError(`WaitForActionInteraction ctor 2nd argument must be a valid NativeMatcher, got ${typeof matcher}`);
    if (!(searchMatcher instanceof NativeMatcher))
      throw new DetoxRuntimeError(`WaitForActionInteraction ctor 3rd argument must be a valid NativeMatcher, got ${typeof searchMatcher}`);

    this._element = element;
    this._originalMatcher = matcher;
    this._searchMatcher = searchMatcher;
  }

  _prepare(searchAction) {
    //if (!searchAction instanceof Action) throw new DetoxRuntimeError(`WaitForActionInteraction _execute argument must be a valid Action, got ${typeof searchAction}`);

    this._call = DetoxAssertionApi.waitForAssertMatcherWithSearchAction(
      call(this._element._call),
      call(this._originalMatcher._call).value,
      call(searchAction._call),
      call(this._searchMatcher._call).value
    );
  }
}

class WaitForActionInteraction extends WaitForActionInteractionBase {
  async scroll(amount, direction = 'down', scrollPositionX, scrollPositionY) {
    this._prepare(new ScrollAmountStopAtEdgeAction(direction, amount, scrollPositionX, scrollPositionY));
    await this.execute();
  }
}

module.exports = {
  Interaction,
  ActionInteraction,
  MatcherAssertionInteraction,
  WaitForActionInteraction,
  WaitForActionInteractionBase,
  WaitForInteraction,
};
