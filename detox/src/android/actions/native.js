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
  constructor(point, duration) {
    super();

    const filteredArgs = (point ? [point.x, point.y] : []).concat(duration ? [duration] : []);
    this._call = invoke.callDirectly(DetoxActionApi.longPress(...filteredArgs));
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

class LongPressAndDragAction extends Action {
  constructor(duration, normalizedPositionX, normalizedPositionY, targetElement, normalizedTargetPositionX, normalizedTargetPositionY, speed, holdDuration) {
    super();

    assertNormalized({ normalizedPositionX });
    assertNormalized({ normalizedPositionY });
    assertNormalized({ normalizedTargetPositionX });
    assertNormalized({ normalizedTargetPositionY });
    assertSpeed({ speed });

    this._call = invoke.callDirectly(
      DetoxActionApi.longPressAndDrag(
        duration,
        normalizedPositionX,
        normalizedPositionY,
        targetElement._call(),
        normalizedTargetPositionX,
        normalizedTargetPositionY,
        speed === 'fast',
        holdDuration
      )
    );
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
  constructor(direction, amount, startPositionX = -1, startPositionY = -1) {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.scrollInDirection(direction, amount, startPositionX, startPositionY));
  }
}

class ScrollAmountStopAtEdgeAction extends Action {
  constructor(direction, amount, startPositionX = -1, startPositionY = -1) {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.scrollInDirectionStaleAtEdge(direction, amount, startPositionX, startPositionY));
  }
}

class ScrollEdgeAction extends Action {
  constructor(edge, startPositionX = -1, startPositionY = -1) {
    super();

    this._call = invoke.callDirectly(DetoxActionApi.scrollToEdge(edge, startPositionX, startPositionY));
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

class SetDatePickerDateAction extends Action {
  constructor(dateString, formatString) {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.setDatePickerDate(dateString, formatString));
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

class AccessibilityActionAction extends Action {
  constructor(actionName) {
    super();
    this._call = invoke.callDirectly(DetoxActionApi.accessibilityAction(actionName));
  }
}

module.exports = {
  Action,
  TapAction,
  TapAtPointAction,
  LongPressAction,
  LongPressAndDragAction,
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
  SetDatePickerDateAction,
  AdjustSliderToPosition,
  AccessibilityActionAction
};
