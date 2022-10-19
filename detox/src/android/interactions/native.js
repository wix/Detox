const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const { expectDescription, actionDescription } = require('../../utils/invocationTraceDescriptions');
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
   * @param traceDescription { String }
   */
  constructor(device, traceDescription) {
    this._call = undefined;
    this._traceDescription = traceDescription;
    this._device = device;
  }

  async execute() {
    return this._device.selectedApp.invoke(this._call, this._traceDescription);
  }
}

class ActionInteraction extends Interaction {
  constructor(device, element, action, traceDescription) {
    super(device, traceDescription);
    this._call = EspressoDetoxApi.perform(call(element._call), action._call);
    // TODO: move this.execute() here from the caller
  }
}

class MatcherAssertionInteraction extends Interaction {
  constructor(device, element, matcher, notCondition, traceDescription) {
    super(device, expectDescription.full(traceDescription, notCondition));

    matcher = notCondition ? matcher.not : matcher;
    this._call = DetoxAssertionApi.assertMatcher(call(element._call), matcher._call.value);
    // TODO: move this.execute() here from the caller
  }
}

class WaitForInteraction extends Interaction {
  constructor(device, element, assertionMatcher, expectTraceDescription) {
    super(device, expectTraceDescription);
    this._element = element;
    this._assertionMatcher = assertionMatcher;
    this._element._selectElementWithMatcher(this._element._originalMatcher);
  }

  async withTimeout(timeout) {
    if (typeof timeout !== 'number') throw new DetoxRuntimeError({ message: `WaitForInteraction withTimeout argument must be a number, got ${typeof timeout}` });
    if (timeout < 0) throw new DetoxRuntimeError({ message: 'timeout must be larger than 0' });

    this._traceDescription = expectDescription.waitForWithTimeout(this._traceDescription, timeout);
    this._call = DetoxAssertionApi.waitForAssertMatcher(call(this._element._call), this._assertionMatcher._call.value, timeout / 1000);
    await this.execute();
  }

  whileElement(searchMatcher) {
    return new WaitForActionInteraction(this._device, this._element, this._assertionMatcher, searchMatcher);
  }
}

class WaitForActionInteractionBase extends Interaction {
  constructor(device, element, matcher, searchMatcher, traceDescrption) {
    super(device, traceDescrption);

    if (!(searchMatcher instanceof NativeMatcher))
      throw new DetoxRuntimeError({ message: `WaitForActionInteraction ctor 3rd argument must be a valid NativeMatcher, got ${typeof searchMatcher}` });

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
    this._traceDescription = expectDescription.waitFor(actionDescription.scroll(amount, direction, scrollPositionX, scrollPositionY));
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
