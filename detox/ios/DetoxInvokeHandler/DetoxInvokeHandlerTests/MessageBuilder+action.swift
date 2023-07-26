//
//  MessageBuilder+action.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Builders for actions.
extension MessageBuilder {
  func makeScreenshotAction(name: String?) -> Self {
    if name != nil {
      message["params"] = [name!]
    }

    return setAction("takeScreenshot")
  }

  func makeTapAction() -> Self {
    return setAction("tap")
  }

  func makeGetAttributesAction() -> Self {
    return setAction("getAttributes")
  }

  func makeMultiTapAction(_ times: Int) -> Self {
    message["params"] = [times]
    return setAction("multiTap")
  }

  func makeLongPressAction() -> Self {
    return setAction("longPress")
  }

  func makeTapBackspaceKeyAction() -> Self {
    return setAction("tapBackspaceKey")
  }

  func makeTapReturnKeyAction() -> Self {
    return setAction("tapReturnKey")
  }

  func makeTypeTextAction(_ text: String) -> Self {
    message["params"] = [text]
    return setAction("typeText")
  }

  func makeReplaceTextAction(_ text: String) -> Self {
    message["params"] = [text]
    return setAction("replaceText")
  }

  func makeClearTextAction() -> Self {
    return setAction("clearText")
  }

  func makeScrollToEdgeAction(_ direction: String) -> Self {
    message["params"] = [direction]
    return setAction("scrollTo")
  }

  func makeScrollAction(
    offset: Double,
    direction: String,
    startNormalizedPositionX: AnyHashable,
    startNormalizedPositionY: AnyHashable
  ) -> Self {
    message["params"] = [offset, direction, startNormalizedPositionX, startNormalizedPositionY]
    return setAction("scroll")
  }

  func makeSetColumnToValueAction(_ index: UInt, _ value: String) -> Self {
    let params: [AnyHashable] = [index, value]
    message["params"] = params

    return setAction("setColumnToValue")
  }

  func makeSetDatePickerDateAction(_ date: String, _ format: String) -> Self {
    message["params"] = [date, format]
    return setAction("setDatePickerDate")
  }

  func makePinchAction(_ scale: Double, _ speed: String, _ angle: Double) -> Self {
    let params: [AnyHashable] = [scale, speed, angle]
    message["params"] = params

    return setAction("pinch")
  }

  func makeAdjustSliderAction(_ position: Double) -> Self {
    message["params"] = [position]
    return setAction("adjustSliderToPosition")
  }

  func setDragParamsAndTarget(
    duration: AnyHashable, normalizedPositionX: AnyHashable, normalizedPositionY: AnyHashable,
    normalizedTargetPositionX: AnyHashable, normalizedTargetPositionY: AnyHashable,
    speed: AnyHashable, holdDuration: AnyHashable, targetElementID: AnyHashable
  ) -> MessageBuilder {
    let params: [AnyHashable] = [
      duration,
      normalizedPositionX,
      normalizedPositionY,
      normalizedTargetPositionX,
      normalizedTargetPositionY,
      speed,
      holdDuration
    ]

    message["params"] = params

    message["targetElement"] = [
      "predicate": [
        "type": "id",
        "value": targetElementID
      ]
    ]

    return self
  }

  func makeSwipeAction(
    direction: AnyHashable, speed: AnyHashable, normalizedOffset: AnyHashable,
    normalizedStartingPointX: AnyHashable, normalizedStartingPointY: AnyHashable
  ) -> MessageBuilder {
    let params: [AnyHashable] = [
      direction,
      speed,
      normalizedOffset,
      normalizedStartingPointX,
      normalizedStartingPointY
    ]

    message["params"] = params

    return setAction("swipe")
  }

  func setParams(x: Int, y: Int) -> MessageBuilder {
    message["params"] = [["x": x, "y": y]]

    return self
  }

  func setDurationParam(duration: AnyHashable) -> MessageBuilder {
    message["params"] = [duration]
    return self
  }

  fileprivate func setAction(_ action: String) -> Self {
    message.merge([
      "type": "action",
      "action": action
    ]) {(_,new) in new}

    return self
  }
}
