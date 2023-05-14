//
//  ActionDelegate.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

/// A delegate for actions that can be performed on an element.
class ActionDelegate: ActionDelegateProtocol {
  let app: XCUIApplication

  let whiteBoxMessageHandler: WhiteBoxMessageHandler

  init(_ app: XCUIApplication, whiteBoxMessageHandler: @escaping WhiteBoxMessageHandler) {
    self.app = app
    self.whiteBoxMessageHandler = whiteBoxMessageHandler
  }

  /// Make an action by Detox Tester.
  func act(action: Action, on element: AnyHashable) throws {
    uiLog("called to start action: `\(action)` on element: `\(element)`")
    do {
      try act(action: action, on: element, testCase: DetoxTester.shared.testCase!)
    } catch {
      uiLog("action failed, creating debug artifacts (if enabled)", type: .debug)
      let artifacts = try createDebugArtifacts(app: self.app, element: element)
      throw Error.errorWithDebugArtifacts(underlyingError: error as CustomStringConvertible, artifacts)
    }

    uiLog("wait until ready to finish action: `\(action)`, on element: `\(element)`", type: .debug)
    try whiteBoxMessageHandler(
      .waitUntilReady
    )?.assertResponse(
      equalsTo: .completed,
      for: .waitUntilReady
    )

    uiLog("finished action: `\(action)`, on element: `\(element)`", type: .debug)
  }

  /// Used for unit testing.
  func act(
    action: Action,
    on element: AnyHashable,
    testCase: XCTestCase
  ) throws {
    guard let element = element as? XCUIElement else {
      uiLog("element (\(element)) is not an XCUIElement", type: .error)
      fatalError("element (\(element)) is not an XCUIElement.")
    }

    uiLog("handling action: `\(action.name)`, on element: `\(element.debugDescription)`")

    switch action {
      case .tap(let times):
        try element.tap(withNumberOfTaps: Int(times))

      case .tapOnAxis(let x, let y):
        element.tap(on: CGPoint(x: x,y: y))

      case let .longPress(duration):
        if let duration = duration {
          element.longPress(duration)
        } else {
          element.longPress()
        }

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
        guard let targetElement = targetElement as? XCUIElement else {
          fatalError("target element (\(targetElement) is not an XCUIElement.")
        }

        let message = WhiteBoxExecutor.Message.longPressAndDrag(
          duration: duration,
          normalizedPositionX: normalizedPositionX,
          normalizedPositionY: normalizedPositionY,
          targetElement: targetElement,
          normalizedTargetPositionX: normalizedTargetPositionX,
          normalizedTargetPositionY: normalizedTargetPositionY,
          speed: speed,
          holdDuration: holdDuration,
          onElement: element
        )

        if let response = whiteBoxMessageHandler(message) {
          try response.assertResponse(equalsTo: .completed, for: message)

          uiLog("long press and drag was executed by the app (white-box)", type: .debug)
        } else {
          // Element holding after dragging is not working on XCUITest.
          // See: https://github.com/asafkorem/XCUITestHoldBugReproduction for details regarding
          // this bug.
          uiLog(
            "long press and drag was executed by XCUITest (black-box). Note that the preferred " +
            "implementation for this action is invoked only for white-box-handled applications",
            type: .debug
          )

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
        }

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

      case .tapKey(let type):
        try element.tapKey(type)

      case .changeText(let change):
        try element.changeText(change, app: app)

      case .scroll(let type):
        try element.scroll(type, app: app, testCase: testCase)

      case .setColumnToValue(index: let index, value: let value):
        element.setColumnToValue(value, atIndex: index)

      case .setDatePicker(date: let date):
        uiLog("setting date picker to date: \(date)", type: .debug)
        let message = WhiteBoxExecutor.Message.setDatePicker(toDate: date, onElement: element)
        if let response = whiteBoxMessageHandler(message) {
          try response.assertResponse(equalsTo: .completed, for: message)
        }

      case .pinch(scale: let scale, speed: let speed, angle: let angle):
        element.pinch(withScale: scale, speed: speed, angle: angle)

      case .adjustSlider(normalizedPosition: let normalizedPosition):
        element.adjustSlider(to: normalizedPosition)

      case .performAccessibilityAction(actionName: let actionName):
        let message = WhiteBoxExecutor.Message.performAccessibilityAction(
          actionName: actionName,
          onElement: element
        )

        if let response = whiteBoxMessageHandler(message) {
          try response.assertResponse(equalsTo: .boolean(true), for: message)
        }

      case .screenshot, .getAttributes:
        fatalError("this action should not be called under `act()`")
    }
  }

  // TODO: extract to another file.
  func getAttributes(from elements: [AnyHashable]) throws -> AnyCodable {
    let mappedElements = elements.compactMap { $0 as? XCUIElement }
    guard mappedElements.count == elements.count
    else {
      fatalError("some element in the elements list is not an XCUIElement (\(elements)).")
    }

    uiLog("fetching white-box attributes from elements", type: .debug)
    let whiteBoxAttributes = whiteBoxMessageHandler(.requestAttributes(ofElements: mappedElements))
    guard case let .elementsAttributes(whiteBoxAttributes) = whiteBoxAttributes else {
      uiLog(
        "got invalid white-box attributes: \(String(describing: whiteBoxAttributes))",
        type: .error
      )
      fatalError("Got invalid white-box attributes!")
    }

    let whiteBoxAttributesDictionary = whiteBoxAttributes.map { $0.value }

    uiLog(
      "got white-box attributes: \(String(describing: whiteBoxAttributesDictionary))",
      type: .debug
    )

    let attributes = mappedElements.enumerated().map { (index, element) in
      let whiteBox = whiteBoxAttributesDictionary[index]
      let blackBox = element.getAttributes()

      // Prefer white-box value for backward-compatibility.
      return whiteBox.merging(blackBox) { (first, _) in first }
    }

    uiLog("new attributes: \(attributes)", type: .debug)

    if attributes.count > 1 {
      return AnyCodable(["elements": attributes])
    } else {
      guard let attributes = attributes.first else {
        uiLog("could not find any attributes (no matching elements)", type: .error)

        throw Error.noMatchingElement
      }

      return AnyCodable(attributes)
    }
  }

  func takeScreenshot(
    _ imageName: String?,
    date: Date = Date(),
    of element: AnyHashable
  ) throws -> AnyCodable {
    guard let element = element as? XCUIScreenshotProviding else {
      throw Error.elementIsNotScreenshotProviding
    }

    return try AnyCodable(element.takeScreenshot(
      imageName, date: date, tempPath: .element
    ))
  }
}
