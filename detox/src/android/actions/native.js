const invoke = require('../../invoke');
const { assertEnum, assertNormalized } = require('../../utils/assertArgument');
const DetoxActionApi = require('../espressoapi/DetoxAction');
const DetoxViewActionsApi = require('../espressoapi/DetoxViewActions');
const ViewActionsApi = require('../espressoapi/ViewActions');

const assertDirection = assertEnum(['left', 'right', 'up', 'down']);
const assertSpeed = assertEnum(['fast', 'slow']);

class Action {
}

class TapAction extends Action {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(value ? DetoxActionApi.tapAtLocation(value.x, value.y) : DetoxViewActionsApi.click());
  }
}

class TapAtPointAction extends Action {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.tapAtLocation(value.x, value.y));
  }
}

class LongPressAction extends Action {
  constructor() {
    super();
    this._call = invoke.callDirectly(ViewActionsApi.longClick());
  }
}

class MultiClickAction extends Action {
  constructor(times) {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.multiClick(times));
  }
}

class PressKeyAction extends Action {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(ViewActionsApi.pressKey(value));
  }
}

class TypeTextAction extends Action {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(DetoxViewActionsApi.typeText(value));
  }
}

class ReplaceTextAction extends Action {
  constructor(value) {
    super();
    this._call = invoke.callDirectly(ViewActionsApi.replaceText(value));
  }
}

class ClearTextAction extends Action {
  constructor() {
    super();
    this._call = invoke.callDirectly(ViewActionsApi.clearText());
  }
}

class ScrollAmountAction extends Action {
  constructor(direction, amount, startPositionX = -1.0, startPositionY = -1.0) {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.scrollInDirection(direction, amount, startPositionX, startPositionY));
  }
}

class ScrollAmountStopAtEdgeAction extends Action {
  constructor(direction, amount, startPositionX = -1.0, startPositionY = -1.0) {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.scrollInDirectionStaleAtEdge(direction, amount, startPositionX, startPositionY));
  }
}

class ScrollEdgeAction extends Action {
  constructor(edge) {
    super();

    this._call = invoke.callDirectly(DetoxActionApi.scrollToEdge(edge));
  }
}

class SwipeAction extends Action {
  constructor(direction, speed, normalizedSwipeOffset, normalizedStartingPointX, normalizedStartingPointY) {
    super();

    assertDirection({ direction });
    assertSpeed({ speed });
    assertNormalized({ normalizedSwipeOffset });
    assertNormalized({ normalizedStartingPointX });
    assertNormalized({ normalizedStartingPointY });

    this._call = invoke.callDirectly(
      DetoxActionApi.swipeInDirection(
        direction,
        speed === 'fast',
        normalizedSwipeOffset,
        normalizedStartingPointX,
        normalizedStartingPointY
      )
    );
  }
}

class GetAttributes extends Action {
  constructor() {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.getAttributes());
  }
}

class ScrollToIndex extends Action {
  constructor(index) {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.scrollToIndex(index));
  }
}

class AdjustSliderToPosition extends Action {
  constructor(newPosition) {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.adjustSliderToPosition(newPosition));
  }
}

class TakeElementScreenshot extends Action {
  constructor() {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.takeViewScreenshot());
  }
}

module.exports = {
  Action,
  TapAction,
  TapAtPointAction,
  LongPressAction,
  MultiClickAction,
  PressKeyAction,
  TypeTextAction,
  ReplaceTextAction,
  ClearTextAction,
  GetAttributes,
  ScrollAmountAction,
  ScrollAmountStopAtEdgeAction,
  ScrollEdgeAction,
  SwipeAction,
  TakeElementScreenshot,
  ScrollToIndex,
  AdjustSliderToPosition,
};
