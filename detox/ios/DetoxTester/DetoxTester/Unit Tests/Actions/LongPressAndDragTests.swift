//
//  LongPressAndDragTests.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class LongPressAndDragTests: DTXTestCase {
  var app: XCUIApplication!
  var actionDelegate: ActionDelegate!
  var longPressAndDragButton: XCUIElement!
  var resultLabel: XCUIElement!

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    actionDelegate = ActionDelegate(app, whiteBoxMessageHandler: { _ in return nil })

    app.launch()

    let longPressAndDragCell = app.staticTexts["Long Press & Drag"]
    XCTAssert(longPressAndDragCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: longPressAndDragCell, testCase: self)

    longPressAndDragButton = app.buttons["longPressAndDragButton"]
    XCTAssert(longPressAndDragButton.waitForExistence(timeout: 30))

    resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")
  }

  func testLongPressAndDragElements() throws {
    let action = Action.longPressAndDrag(
      duration: 0.7,
      normalizedPositionX: nil,
      normalizedPositionY: nil,
      targetElement: resultLabel,
      normalizedTargetPositionX: nil,
      normalizedTargetPositionY: nil,
      speed: .slow,
      holdDuration: nil
    )

    try actionDelegate.act(action: action, on: longPressAndDragButton, testCase: self)

    XCTAssertEqual(resultLabel.label, "Success!")
  }

  func testLongPressAndDragCoordinates() throws {
    let action = Action.longPressAndDrag(
      duration: 0.7,
      normalizedPositionX: 0.2,
      normalizedPositionY: 0.2,
      targetElement: resultLabel,
      normalizedTargetPositionX: 0.7,
      normalizedTargetPositionY: 0.6,
      speed: .fast,
      holdDuration: nil
    )

    try actionDelegate.act(action: action, on: longPressAndDragButton, testCase: self)

    XCTAssertEqual(resultLabel.label, "Success!")
  }

  func testShortPressAndDrag() throws {
    let action = Action.longPressAndDrag(
      duration: 0.3,
      normalizedPositionX: nil,
      normalizedPositionY: nil,
      targetElement: resultLabel,
      normalizedTargetPositionX: nil,
      normalizedTargetPositionY: nil,
      speed: .slow,
      holdDuration: nil
    )

    try actionDelegate.act(action: action, on: longPressAndDragButton, testCase: self)

    XCTAssertNotEqual(resultLabel.label, "Success!")
  }

  func testLongPressWithoutDrag() throws {
    try actionDelegate.act(
      action: Action.longPress(),
      on: longPressAndDragButton,
      testCase: self
    )

    XCTAssertNotEqual(resultLabel.label, "Success!")
  }
}
