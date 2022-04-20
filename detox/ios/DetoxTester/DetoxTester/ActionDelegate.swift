//
//  ActionDelegate.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class ActionDelegate: ActionDelegateProtocol {
  let app: XCUIApplication

  init(_ app: XCUIApplication) {
    self.app = app
  }

  /// Make an action by Detox Tester.
  func act(action: Action, on element: AnyHashable) throws {
    try act(action: action, on: element, testCase: DetoxTester.shared.testCase!)
  }

  /// Used for unit testing.
  func act(
    action: Action,
    on element: AnyHashable,
    testCase: XCTestCase
  ) throws {
    guard let element = element as? XCUIElement else {
      throw ActionDelegateError.notXCUIElement
    }

    uiLog("handling action: `\(action)`, on element: `\(element)`")

    switch action {
      case .tap(let times):
        element.tap(withNumberOfTaps: Int(times))

      case .tapOnAxis(let x, let y):
        element.tap(on: CGPoint(x: x,y: y))

      case .longPress:
        element.longPress()

      case .longPressAndDrag(
        let duration,
        let normalizedPositionX,
        let normalizedPositionY,
        let targetElement,
        let normalizedTargetPositionX,
        let normalizedTargetPositionY,
        let speed,
        let holdDuration
      ):
        try element.longPress(
          duration: duration,
          normalizedOffsetX: normalizedPositionX,
          normalizedOffsetY: normalizedPositionY,
          dragTo: targetElement,
          normalizedTargetOffsetX: normalizedTargetPositionX,
          normalizedTargetOffsetY: normalizedTargetPositionY,
          speed: speed,
          holdDuration: holdDuration,
          testCase: testCase
        )

      case .swipe(
        let direction,
        let speed,
        let normalizedOffset,
        let normalizedStartingPointX,
        let normalizedStartingPointY
      ):
        element.swipe(
          direction: direction,
          speed: speed,
          normalizedOffset: normalizedOffset,
          normalizedStartingPointX: normalizedStartingPointX,
          normalizedStartingPointY: normalizedStartingPointY,
          app: app
        )

      case .screenshot(let imageName):
        fatalError("this action should not be called under `act()`")

      case .getAttributes:
        fatalError("this action should not be called under `act()`")

      case .tapKey(_):
        fatalError("not implmented yet")
      case .changeText(_):
        fatalError("not implmented yet")
      case .scroll(_):
        fatalError("not implmented yet")
      case .setColumnToValue(index: let index, value: let value):
        fatalError("not implmented yet")
      case .setDatePicker(date: _):
        fatalError("not implmented yet")
      case .pinch(scale: let scale_, speed: let speed_, angle: let angle_):
        fatalError("not implmented yet")
      case .adjustSlider(normalizedPosition: let normalizedPosition):
        fatalError("not implmented yet")
    }
  }

  func getAttributes(from elements: [AnyHashable]) throws -> AnyCodable {
    fatalError("not implmented yet")
  }

  func takeScreenshot(
    _ imageName: String?,
    date: Date = Date.now
  ) throws -> AnyCodable {
    return try AnyCodable(app.takeScreenshot(imageName, date: date))
  }
}

extension ActionDelegate {
  enum ActionDelegateError: Error {
    case notXCUIElement
  }
}
