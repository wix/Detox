//
//  MessageBuilder.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Builder for a simple JSON message (used for testing).
class MessageBuilder {
  private var message = [String: AnyHashable]()

  func expectToExist() -> MessageBuilder {
    return expect(value: "toExist")
  }

  func expectToHaveSliderPosition(position: Double) -> MessageBuilder {
    return expectToHaveSliderPosition(position: position, tolerance: nil)
  }

  func expectToHaveSliderPosition(position: Double, tolerance: Double?) -> MessageBuilder {
    message["params"] = tolerance != nil ? [position, tolerance!] : [position]

    return expect(value: "toHaveSliderPosition")
  }


  func expectToBeVisible() -> MessageBuilder {
    return expectToBeVisible(nil)
  }

  func expectToBeVisible(_ threshold: Double?) -> MessageBuilder {
    if threshold != nil {
      message["params"] = [threshold!]
    }

    return expect(value: "toBeVisible")
  }

  func expectToHaveText(_ text: String) -> MessageBuilder {
    message["params"] = [text]

    return expect(value: "toHaveText")
  }

  func expectToHaveId(_ id: String) -> MessageBuilder {
    message["params"] = [id]

    return expect(value: "toHaveId")
  }

  func expectToBeFocused() -> MessageBuilder {
    return expect(value: "toBeFocused")
  }

  func negateExpectation() -> MessageBuilder {
    message["modifiers"] = ["not"]

    return self
  }

  private func expect(value: String) -> MessageBuilder {
    message.merge([
      "type": "expectation",
      "expectation": value
    ]) {(_,new) in new}

    return self
  }

  func makeScreenshotAction(name: String?) -> MessageBuilder {
    if name != nil {
      message["params"] = [name!]
    }

    return setAction("takeScreenshot")
  }

  func makeTapAction() -> MessageBuilder {
    return setAction("tap")
  }

  func makeGetAttributesAction() -> MessageBuilder {
    return setAction("getAttributes")
  }

  func makeMultiTapAction(_ times: Int) -> MessageBuilder {
    message["params"] = [times]
    return setAction("multiTap")
  }

  func makeLongPressAction() -> MessageBuilder {
    return setAction("longPress")
  }

  func makeTapBackspaceKeyAction() -> MessageBuilder {
    return setAction("tapBackspaceKey")
  }

  func makeTapReturnKeyAction() -> MessageBuilder {
    return setAction("tapReturnKey")
  }

  func makeTypeTextAction(_ text: String) -> MessageBuilder {
    message["params"] = [text]
    return setAction("typeText")
  }

  func makeReplaceTextAction(_ text: String) -> MessageBuilder {
    message["params"] = [text]
    return setAction("replaceText")
  }

  func makeClearTextAction() -> MessageBuilder {
    return setAction("clearText")
  }

  func makeScrollToEdgeAction(_ direction: String) -> MessageBuilder {
    message["params"] = [direction]
    return setAction("scrollTo")
  }

  func makeScrollAction(
    offset: Double,
    direction: String,
    startNormalizedPositionX: AnyHashable,
    startNormalizedPositionY: AnyHashable
  ) -> MessageBuilder {
    message["params"] = [offset, direction, startNormalizedPositionX, startNormalizedPositionY]
    return setAction("scroll")
  }

  func makeSetColumnToValueAction(_ index: UInt, _ value: String) -> MessageBuilder {
    let params: [AnyHashable] = [index, value]
    message["params"] = params

    return setAction("setColumnToValue")
  }

  func makeSetDatePickerDateAction(_ date: String, _ format: String) -> MessageBuilder {
    message["params"] = [date, format]
    return setAction("setDatePickerDate")
  }

  func makePinchAction(_ scale: Double, _ speed: String, _ angle: Double) -> MessageBuilder {
    let params: [AnyHashable] = [scale, speed, angle]
    message["params"] = params

    return setAction("pinch")
  }

  func makeAdjustSliderAction(_ position: Double) -> MessageBuilder {
    message["params"] = [position]
    return setAction("adjustSliderToPosition")
  }

  private func setAction(_ action: String) -> MessageBuilder {
    message.merge([
      "type": "action",
      "action": action
    ]) {(_,new) in new}

    return self
  }

  func setDragParams(
    duration: AnyHashable, normalizedPositionX: AnyHashable, normalizedPositionY: AnyHashable,
    targetElement: AnyHashable, normalizedTargetPositionX: AnyHashable,
    normalizedTargetPositionY: AnyHashable,
    speed: AnyHashable, holdDuration: AnyHashable
  ) -> MessageBuilder {
    let params: [AnyHashable] = [
      duration,
      normalizedPositionX,
      normalizedPositionY,
      targetElement,
      normalizedTargetPositionX,
      normalizedTargetPositionY,
      speed,
      holdDuration
    ]

    message["params"] = params

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

  func setTextPredicate(_ value: String) -> MessageBuilder {
    return setPredicate("text", value)
  }

  func setValuePredicate(_ value: String) -> MessageBuilder {
    return setPredicate("value", value)
  }

  func setPredicate(_ type: String, _ value: String) -> MessageBuilder {
    message["predicate"] = [
      "type": type,
      "value": value
    ]

    return self
  }

  func setAndPredicates(_ predicates: [(type: String, value: String)]) -> MessageBuilder {
    var predicatesList: [[String: String]] = []
    for predicate in predicates {
      predicatesList.append([
        "type": predicate.type,
        "value": predicate.value
      ])
    }

    let predicate: [String: AnyHashable] = [
      "type": "and",
      "predicates": predicatesList
    ]

    message["predicate"] = predicate

    return self
  }

  func setChildWithAncestorPredicate(_ childID: String, _ parentID: String) -> MessageBuilder {
    let childPredicate: [String: AnyHashable] = [
      "type": "id",
      "value": childID
    ]

    let ancestorPredicate: [String: AnyHashable] = [
      "type": "ancestor",
      "predicate": [
        "type": "id",
        "value": parentID
      ]
    ]

    let predicate: [String: AnyHashable] = [
      "type": "and",
      "predicates": [
        childPredicate,
        ancestorPredicate
      ]
    ]

    message["predicate"] = predicate

    return self
  }

  func setParentWithdescendantPredicate(_ parentID: String, _ childId: String) -> MessageBuilder {
    let parentPredicate: [String: AnyHashable] = [
      "type": "id",
      "value": parentID
    ]

    let descendantPredicate: [String: AnyHashable] = [
      "type": "descendant",
      "predicate": [
        "type": "id",
        "value": childId
      ]
    ]

    let predicate: [String: AnyHashable] = [
      "type": "and",
      "predicates": [
        parentPredicate,
        descendantPredicate
      ]
    ]

    message["predicate"] = predicate

    return self
  }

  func setIdPredicate(_ value: String) -> MessageBuilder {
    return setPredicate("id", value)
  }

  func setLabelPredicate(_ value: String) -> MessageBuilder {
    return setPredicate("label", value)
  }

  func setTypePredicate(_ value: String) -> MessageBuilder {
    return setPredicate("type", value)
  }

  func setTraitsPredicate(_ values: [String]) -> MessageBuilder {
    let predicate: [String: AnyHashable] = [
      "type": "traits",
      "value": values
    ]

    message["predicate"] = predicate

    return self
  }

  func setParams(x: Int, y: Int) -> MessageBuilder {
    message["params"] = [["x": x, "y": y]]

    return self
  }

  func at(index: UInt) -> MessageBuilder {
    message["atIndex"] = index

    return self
  }

  func waitUntilVisible(id: String) -> MessageBuilder {
    message["while"] = MessageBuilder().setIdPredicate(id).expectToBeVisible().build()

    return self
  }

  func setTimeout(_ timeout: Double) -> MessageBuilder {
    message["timeout"] = timeout

    return self
  }

  func build() -> [String: AnyHashable] {
    return message
  }
}
