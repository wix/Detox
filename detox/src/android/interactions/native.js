const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const { expectDescription, actionDescription } = require('../../utils/invocationTraceDescriptions');
const log = require('../../utils/logger').child({ cat: 'ws-client, ws' });
const traceInvocationCall = require('../../utils/traceInvocationCall').bind(null, log);
const { ScrollAmountStopAtEdgeAction } = require('../actions/native');
const { NativeMatcher } = require('../core/NativeMatcher');
const DetoxAssertionApi = require('../espressoapi/DetoxAssertion');
const EspressoDetoxApi = require('../espressoapi/EspressoDetox');

function call(maybeAFunction) {
  return maybeAFunction instanceof Function ? maybeAFunction() : maybeAFunction;
}

class Interaction {
  constructor(invocationManager, traceDescription) {
    this._call = undefined;
    this._traceDescription = traceDescription;
    this._invocationManager = invocationManager;
  }

  async execute() {
    return traceInvocationCall(this._traceDescription, this._call,
      this._invocationManager.execute(this._call).then((resultObj) => resultObj ? resultObj.result : undefined));
  }
}

class ActionInteraction extends Interaction {
  constructor(invocationManager, matcher, action, traceDescription) {
    super(invocationManager, traceDescription);
    this._call = EspressoDetoxApi.perform(matcher, action._call);
    // TODO [2024-12-01]: move this.execute() here from the caller
  }
}

class MatcherAssertionInteraction extends Interaction {
  constructor(invocationManager, element, matcher, notCondition, traceDescription) {
    traceDescription = expectDescription.full(traceDescription, notCondition);
    super(invocationManager, traceDescription);

    matcher = notCondition ? matcher.not : matcher;
    this._call = DetoxAssertionApi.assertMatcher(call(element._call), matcher._call.value);
    // TODO [2024-12-01]: move this.execute() here from the caller
  }
}

class WaitForInteraction extends Interaction {
  constructor(invocationManager, element, assertionMatcher, expectTraceDescription) {
    super(invocationManager, expectTraceDescription);
    this._element = element;
    this._assertionMatcher = assertionMatcher;
  }

  async withTimeout(timeout) {
    if (typeof timeout !== 'number') throw new DetoxRuntimeError({ message: `WaitForInteraction withTimeout argument must be a number, got ${typeof timeout}` });
    if (timeout < 0) throw new DetoxRuntimeError({ message: 'timeout must be larger than 0' });

    this._traceDescription = expectDescription.waitForWithTimeout(this._traceDescription, timeout);
    this._call = DetoxAssertionApi.waitForAssertMatcher(call(this._element._call), this._assertionMatcher._call.value, timeout / 1000);
    await this.execute();
  }

  whileElement(searchMatcher) {
    return new WaitForActionInteraction(this._invocationManager, this._element, this._assertionMatcher, searchMatcher);
  }
}

class WaitForActionInteractionBase extends Interaction {
  constructor(invocationManager, element, matcher, searchMatcher, traceDescription) {
    super(invocationManager, traceDescription);

    if (!(searchMatcher instanceof NativeMatcher))
      throw new DetoxRuntimeError({ message: `WaitForActionInteraction ctor 3rd argument must be a valid NativeMatcher, got ${typeof searchMatcher}` });

    this._element = element;
    this._originalMatcher = matcher;
    this._searchMatcher = searchMatcher;
  }

  _prepare(searchAction) {
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
